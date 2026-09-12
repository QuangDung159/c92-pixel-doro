import {
  isRunningBreak,
  isRunningStandardFocus,
  type ClockPort,
  type IdPort,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
} from '@pixeldoro/application';

import type {
  AnalyticsQueue,
  AppDefaultMode,
  AppSettingsPatch,
  AppSettingsRecord,
  AppSettingsRepository,
  InstallationRepository,
} from '../persistence';
import {
  BREAK_NOTIFICATION_KIND,
  STANDARD_FOCUS_NOTIFICATION_KIND,
  breakNotificationKey,
  standardFocusNotificationKey,
  type BreakCompletionNotificationPort,
  type FocusCompletionNotificationPort,
  type FocusNotificationPermission,
} from '../notifications';
import type { BootstrapDurableSnapshot } from '../ports/bootstrap-data.port';
import type { ConfirmedResetSuccess, ResetNotificationCleanupPort } from '../reset';
import type { AnalyticsCaptureGate } from './analytics-capture.gate';
import type { SensoryFeedbackPort } from './sensory-feedback';

export type SettingKey =
  | 'focusDurationMinutes'
  | 'defaultMode'
  | 'soundEnabled'
  | 'hapticsEnabled'
  | 'notificationsEnabled'
  | 'analyticsEnabled'
  | 'reset';

export type SettingsIssueCode =
  | 'SETTINGS_READ_FAILED'
  | 'SETTINGS_WRITE_FAILED'
  | 'SETTINGS_REFRESH_FAILED'
  | 'ANALYTICS_CLEANUP_REQUIRED'
  | 'NOTIFICATION_PERMISSION_FAILED'
  | 'NOTIFICATION_OS_BLOCKED'
  | 'NOTIFICATION_SYNC_FAILED'
  | 'SYSTEM_SETTINGS_UNAVAILABLE'
  | 'RESET_FAILED';

export type SettingsProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly issue: SettingsIssueCode }
  | {
      readonly status: 'ready';
      readonly settings: AppSettingsRecord;
      readonly busy: readonly SettingKey[];
      readonly notificationPermission: FocusNotificationPermission | 'checking' | 'unavailable';
      readonly issue: SettingsIssueCode | null;
    };

interface SettingsBootstrapPort {
  getSnapshot():
    | { readonly status: 'ready'; readonly snapshot: BootstrapDurableSnapshot }
    | { readonly status: string };
  refreshReadySnapshot(): Promise<
    | { readonly ok: true; readonly value: BootstrapDurableSnapshot }
    | { readonly ok: false }
  >;
}

type SettingsNotificationPort = FocusCompletionNotificationPort &
  BreakCompletionNotificationPort & ResetNotificationCleanupPort;

export interface SettingsControllerDependencies {
  readonly analyticsGate: AnalyticsCaptureGate;
  readonly analyticsQueue: Pick<AnalyticsQueue, 'clear'>;
  readonly bootstrap: SettingsBootstrapPort;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly installation: InstallationRepository;
  readonly notifications: SettingsNotificationPort;
  readonly openSystemSettings: () => Promise<void>;
  readonly reset: () => Promise<
    | { readonly ok: true; readonly value: ConfirmedResetSuccess }
    | { readonly ok: false }
  >;
  readonly sensory: SensoryFeedbackPort;
  readonly sessions: Pick<SessionRepository, 'findActive'>;
  readonly settings: AppSettingsRepository;
}

const validDuration = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 15 && value <= 120 && value % 5 === 0;

export class SettingsController {
  private projection: SettingsProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private readonly operations = new Map<SettingKey, Promise<boolean>>();
  private commandTail: Promise<void> = Promise.resolve();
  private active = false;
  private disposed = false;
  private generation = 0;
  private privacyCleanupSatisfied = false;
  private retryAction: (() => Promise<boolean>) | undefined;

  constructor(private readonly dependencies: SettingsControllerDependencies) {}

  getSnapshot = (): SettingsProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = async (): Promise<void> => {
    if (this.disposed) return;
    this.active = true;
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    const loaded = await this.dependencies.coordinator.run(() => this.dependencies.settings.find())
      .catch(() => null);
    if (!this.isCurrent(generation)) return;
    if (loaded === null || !loaded.ok || loaded.value === null) {
      this.retryAction = async () => { await this.activate(); return true; };
      this.publish({ status: 'error', issue: 'SETTINGS_READ_FAILED' });
      return;
    }
    if (loaded.value.analyticsEnabled) {
      this.privacyCleanupSatisfied = false;
      this.dependencies.analyticsGate.allow();
    } else {
      this.dependencies.analyticsGate.block();
    }
    this.publishReady(loaded.value, 'checking', null);
    void this.refreshPermission(generation);
    if (!loaded.value.analyticsEnabled && !this.privacyCleanupSatisfied) {
      void this.resumePrivacyCleanup();
    }
  };

  deactivate = (): void => {
    this.active = false;
    this.generation += 1;
  };

  setFocusDuration = (value: number): Promise<boolean> =>
    validDuration(value)
      ? this.saveSimple('focusDurationMinutes', { focusDurationMinutes: value })
      : Promise.resolve(false);

  setDefaultMode = (value: AppDefaultMode): Promise<boolean> =>
    value === 'relax' || value === 'strict'
      ? this.saveSimple('defaultMode', { defaultMode: value })
      : Promise.resolve(false);

  setSoundEnabled = (value: boolean): Promise<boolean> =>
    this.startOperation('soundEnabled', async () => {
      if (!await this.patch({ soundEnabled: value })) {
        this.fail('SETTINGS_WRITE_FAILED', () => this.setSoundEnabled(value));
        return false;
      }
      if (!await this.reloadAfterCommit(() => this.setSoundEnabled(value))) return false;
      if (!this.currentSettings()?.notificationsEnabled) return true;
      const permission = await this.readPermission(false);
      return permission === 'allowed' ? this.ensureActiveNotification() : true;
    });

  setHapticsEnabled = (value: boolean): Promise<boolean> =>
    this.saveSimple('hapticsEnabled', { hapticsEnabled: value });

  setNotificationsEnabled = (value: boolean): Promise<boolean> =>
    this.startOperation('notificationsEnabled', () => this.saveNotifications(value));

  setAnalyticsEnabled = (value: boolean): Promise<boolean> =>
    this.startOperation('analyticsEnabled', () => this.saveAnalytics(value));

  resetAllLocalData = (): Promise<boolean> =>
    this.startOperation('reset', async () => {
      const current = this.currentSettings();
      if (current === null) return false;
      await this.dependencies.sensory.emit(
        'destructive_confirmation', current, `reset:${this.dependencies.clock.nowMs()}`,
      ).catch(() => undefined);
      const result = await this.dependencies.coordinator.run(this.dependencies.reset)
        .catch(() => null);
      if (result === null || !result.ok) {
        this.fail('RESET_FAILED', () => this.resetAllLocalData());
        return false;
      }
      this.dependencies.analyticsGate.allow();
      this.privacyCleanupSatisfied = false;
      return this.reloadAfterCommit(null);
    });

  retry = (): Promise<boolean> => this.retryAction?.() ?? Promise.resolve(false);

  dismissIssue = (): void => {
    this.retryAction = undefined;
    if (this.projection.status === 'ready') this.publish({ ...this.projection, issue: null });
  };

  openSystemSettings = async (): Promise<boolean> => {
    try {
      await this.dependencies.openSystemSettings();
      return true;
    } catch {
      this.fail('SYSTEM_SETTINGS_UNAVAILABLE');
      return false;
    }
  };

  dispose(): void {
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.listeners.clear();
  }

  private saveSimple(key: SettingKey, patch: Omit<AppSettingsPatch, 'updatedAt'>): Promise<boolean> {
    return this.startOperation(key, async () => {
      const saved = await this.patch(patch);
      if (!saved) {
        this.fail('SETTINGS_WRITE_FAILED', () => this.saveSimple(key, patch));
        return false;
      }
      return this.reloadAfterCommit(() => this.saveSimple(key, patch));
    });
  }

  private async saveAnalytics(enabled: boolean): Promise<boolean> {
    this.dependencies.analyticsGate.block();
    if (!enabled) {
      this.privacyCleanupSatisfied = false;
      if (!await this.patch({ analyticsEnabled: false })) {
        if (this.currentSettings()?.analyticsEnabled === true) this.dependencies.analyticsGate.allow();
        this.fail('SETTINGS_WRITE_FAILED', () => this.setAnalyticsEnabled(false));
        return false;
      }
      if (!await this.reloadAfterCommit(() => this.setAnalyticsEnabled(false))) return false;
      return this.finishPrivacyCleanup();
    }

    this.privacyCleanupSatisfied = false;
    if (!await this.clearQueueAndEnsureIdentity(false)) {
      this.fail('ANALYTICS_CLEANUP_REQUIRED', () => this.setAnalyticsEnabled(true));
      return false;
    }
    if (!await this.patch({ analyticsEnabled: true })) {
      this.fail('SETTINGS_WRITE_FAILED', () => this.setAnalyticsEnabled(true));
      return false;
    }
    const refreshed = await this.reloadAfterCommit(() => this.setAnalyticsEnabled(true));
    if (refreshed) this.dependencies.analyticsGate.allow();
    return refreshed;
  }

  private async finishPrivacyCleanup(): Promise<boolean> {
    if (await this.clearQueueAndEnsureIdentity(true)) {
      this.privacyCleanupSatisfied = true;
      this.retryAction = undefined;
      this.clearIssue();
      return true;
    }
    this.fail('ANALYTICS_CLEANUP_REQUIRED', () => this.finishPrivacyCleanup());
    return false;
  }

  private resumePrivacyCleanup(): Promise<boolean> {
    return this.startOperation('analyticsEnabled', () => this.finishPrivacyCleanup());
  }

  private async clearQueueAndEnsureIdentity(rotate: boolean): Promise<boolean> {
    const cleared = await this.dependencies.coordinator.run(() => this.dependencies.analyticsQueue.clear())
      .catch(() => null);
    if (cleared === null || !cleared.ok) return false;
    const installation = await this.dependencies.installation.find().catch(() => null);
    if (installation === null || !installation.ok || installation.value === null) return false;
    if (!rotate && installation.value.anonymousAnalyticsId?.trim()) return true;
    let nextId: string;
    try {
      nextId = this.dependencies.id.nextId();
      if (nextId === installation.value.anonymousAnalyticsId) nextId = this.dependencies.id.nextId();
    } catch {
      return false;
    }
    if (!nextId.trim() || nextId === installation.value.anonymousAnalyticsId) return false;
    const updated = await this.dependencies.installation
      .setAnonymousAnalyticsId(nextId, this.dependencies.clock.nowMs()).catch(() => null);
    return updated?.ok === true && updated.value === 'updated';
  }

  private async saveNotifications(enabled: boolean): Promise<boolean> {
    if (!await this.patch({ notificationsEnabled: enabled })) {
      this.fail('SETTINGS_WRITE_FAILED', () => this.setNotificationsEnabled(enabled));
      return false;
    }
    if (!await this.reloadAfterCommit(() => this.setNotificationsEnabled(enabled))) return false;
    const permission = await this.readPermission(enabled);
    if (!enabled) return this.cancelActiveNotification();
    if (permission !== 'allowed') {
      if (permission === 'denied') this.fail('NOTIFICATION_OS_BLOCKED');
      return true;
    }
    return this.ensureActiveNotification();
  }

  private async readPermission(
    mayRequest: boolean,
    expectedGeneration?: number,
  ): Promise<FocusNotificationPermission | 'unavailable'> {
    let result = await this.dependencies.notifications.readPermission().catch(() => null);
    if (result?.ok && result.value === 'undetermined' && mayRequest) {
      result = await this.dependencies.notifications.requestPermission().catch(() => null);
    }
    const permission = result?.ok ? result.value : 'unavailable';
    if (expectedGeneration !== undefined && !this.isCurrent(expectedGeneration)) return permission;
    if (this.projection.status === 'ready') {
      this.publish({ ...this.projection, notificationPermission: permission });
    }
    if (permission === 'unavailable') this.fail('NOTIFICATION_PERMISSION_FAILED');
    return permission;
  }

  private async refreshPermission(generation: number): Promise<void> {
    const permission = await this.readPermission(false, generation);
    if (!this.isCurrent(generation)) return;
    if (permission === 'denied' && this.currentSettings()?.notificationsEnabled) {
      this.fail('NOTIFICATION_OS_BLOCKED');
    }
  }

  private async cancelActiveNotification(): Promise<boolean> {
    const active = await this.dependencies.sessions.findActive().catch(() => null);
    const cancelled = await this.dependencies.notifications
      .cancelKnownSession(active?.ok ? active.value?.id ?? null : null).catch(() => null);
    if (cancelled?.ok) return true;
    this.fail('NOTIFICATION_SYNC_FAILED', () => this.cancelActiveNotification());
    return false;
  }

  private async ensureActiveNotification(): Promise<boolean> {
    const current = this.currentSettings();
    const active = await this.dependencies.sessions.findActive().catch(() => null);
    if (current === null || active === null || !active.ok) {
      this.fail('NOTIFICATION_SYNC_FAILED', () => this.ensureActiveNotification());
      return false;
    }
    const session = active.value;
    if (session === null) return true;
    const input = isRunningStandardFocus(session) ? {
      kind: STANDARD_FOCUS_NOTIFICATION_KIND,
      operationKey: standardFocusNotificationKey(session.id),
      sessionId: session.id,
      endsAt: session.endsAt,
      soundEnabled: current.soundEnabled,
    } as const : isRunningBreak(session) ? {
      kind: BREAK_NOTIFICATION_KIND,
      operationKey: breakNotificationKey(session.id),
      sessionId: session.id,
      endsAt: session.endsAt,
      soundEnabled: current.soundEnabled,
      breakType: session.sessionType,
    } as const : null;
    if (input === null) return true;
    const ensured = input.kind === STANDARD_FOCUS_NOTIFICATION_KIND
      ? await this.dependencies.notifications.ensure(input).catch(() => null)
      : await this.dependencies.notifications.ensure(input).catch(() => null);
    if (ensured?.ok) return true;
    this.fail('NOTIFICATION_SYNC_FAILED', () => this.ensureActiveNotification());
    return false;
  }

  private patch(patch: Omit<AppSettingsPatch, 'updatedAt'>): Promise<boolean> {
    return this.dependencies.coordinator.run(async () => {
      const result = await this.dependencies.settings.patch({
        ...patch,
        updatedAt: this.dependencies.clock.nowMs(),
      });
      return result.ok && result.value === 'updated';
    }).catch(() => false);
  }

  private async reloadAfterCommit(retry: (() => Promise<boolean>) | null): Promise<boolean> {
    const [loaded, refreshed] = await Promise.all([
      this.dependencies.settings.find().catch(() => null),
      this.dependencies.bootstrap.refreshReadySnapshot().catch(() => null),
    ]);
    if (loaded === null || !loaded.ok || loaded.value === null || refreshed?.ok !== true) {
      this.fail('SETTINGS_REFRESH_FAILED', retry ?? undefined);
      return false;
    }
    const permission = this.projection.status === 'ready'
      ? this.projection.notificationPermission : 'checking';
    this.publishReady(loaded.value, permission, null);
    this.retryAction = undefined;
    return true;
  }

  private startOperation(key: SettingKey, work: () => Promise<boolean>): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false);
    const existing = this.operations.get(key);
    if (existing !== undefined) return existing;
    this.setBusy(key, true);
    const operation = this.commandTail.then(work, work).catch(() => {
      this.fail('SETTINGS_WRITE_FAILED', () => this.startOperation(key, work));
      return false;
    }).finally(() => {
      if (this.operations.get(key) === operation) this.operations.delete(key);
      this.setBusy(key, false);
    });
    this.commandTail = operation.then(() => undefined, () => undefined);
    this.operations.set(key, operation);
    return operation;
  }

  private currentSettings(): AppSettingsRecord | null {
    return this.projection.status === 'ready' ? this.projection.settings : null;
  }

  private publishReady(
    settings: AppSettingsRecord,
    notificationPermission: FocusNotificationPermission | 'checking' | 'unavailable',
    issue: SettingsIssueCode | null,
  ): void {
    const busy = this.projection.status === 'ready' ? this.projection.busy : [];
    this.publish({ status: 'ready', settings, busy, notificationPermission, issue });
  }

  private setBusy(key: SettingKey, busy: boolean): void {
    if (this.projection.status !== 'ready') return;
    const next = new Set(this.projection.busy);
    if (busy) next.add(key); else next.delete(key);
    this.publish({ ...this.projection, busy: Object.freeze([...next]) });
  }

  private fail(issue: SettingsIssueCode, retry?: () => Promise<boolean>): void {
    this.retryAction = retry;
    if (this.projection.status === 'ready') this.publish({ ...this.projection, issue });
    else this.publish({ status: 'error', issue });
  }

  private clearIssue(): void {
    if (this.projection.status === 'ready') this.publish({ ...this.projection, issue: null });
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && this.active && generation === this.generation;
  }

  private publish(projection: SettingsProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) {
      try { listener(); } catch { /* Subscribers cannot change Settings truth. */ }
    }
  }
}
