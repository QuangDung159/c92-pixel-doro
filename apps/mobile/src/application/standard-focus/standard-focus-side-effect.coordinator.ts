import type {
  ApplicationResult,
  LoadStandardFocusResultError,
  LoadStandardFocusResultOutcome,
  RunningSessionRecord,
} from '@pixeldoro/application';

import type {
  FocusCompletionNotificationPort,
  FocusNotificationResponseSource,
  SessionNotificationResponse,
} from '../notifications';
import {
  BREAK_NOTIFICATION_KIND,
  STANDARD_FOCUS_NOTIFICATION_KIND,
  breakNotificationKey,
  isValidStandardFocusNotificationSession,
  standardFocusNotificationKey,
} from '../notifications';
import type { StandardFocusAnalyticsRecorderPort } from './standard-focus-analytics.recorder';

export interface StandardFocusSideEffectSettings {
  readonly analyticsEnabled: boolean;
  readonly notificationsEnabled: boolean;
  readonly soundEnabled: boolean;
}

export interface StandardFocusSideEffectCoordinatorDependencies {
  readonly analytics: StandardFocusAnalyticsRecorderPort;
  readonly notifications: FocusCompletionNotificationPort;
  readonly responses: FocusNotificationResponseSource;
  readonly readSettings: () => StandardFocusSideEffectSettings | null;
  readonly loadResult: (
    sessionId: string,
  ) => Promise<ApplicationResult<LoadStandardFocusResultOutcome, LoadStandardFocusResultError>>;
  readonly onNotificationSession: (sessionId: string) => Promise<void>;
  readonly onBreakNotificationSession?: (sessionId: string) => Promise<void>;
}

export class StandardFocusSideEffectCoordinator {
  private unsubscribe: (() => void) | undefined;
  private started = false;
  private disposed = false;
  private readonly handledResponseIds = new Set<string>();
  private readonly pending = new Set<Promise<void>>();

  constructor(private readonly dependencies: StandardFocusSideEffectCoordinatorDependencies) {}

  start(): void {
    if (this.disposed || this.started) return;
    this.started = true;
    this.track(this.startInternal());
  }

  afterStarted(session: RunningSessionRecord): void {
    if (this.disposed || !isValidStandardFocusNotificationSession(session)) return;
    this.track(this.runStarted(session));
  }

  ensureRunning(session: RunningSessionRecord): void {
    if (this.disposed || !isValidStandardFocusNotificationSession(session)) return;
    this.track(this.ensureNotification(session));
  }

  afterTerminal(
    sessionId: string,
    freshness: 'fresh_commit' | 'existing_terminal',
  ): void {
    if (this.disposed || sessionId.trim().length === 0) return;
    this.track(this.runTerminal(sessionId, freshness));
  }

  async whenIdle(): Promise<void> {
    while (this.pending.size > 0) {
      await Promise.allSettled([...this.pending]);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.handledResponseIds.clear();
  }

  private async startInternal(): Promise<void> {
    await this.dependencies.notifications.prepare().catch(() => undefined);
    if (this.disposed) return;
    try {
      this.unsubscribe = await this.dependencies.responses.subscribe((response) => {
        this.track(this.handleResponse(response));
      });
      const initial = await this.dependencies.responses.readInitial();
      if (initial !== null) await this.handleResponse(initial);
    } catch {
      // Notification response delivery is optional and cannot affect durable truth.
    }
  }

  private async runStarted(session: RunningSessionRecord): Promise<void> {
    await Promise.allSettled([
      this.dependencies.analytics.recordStarted(session),
      this.ensureNotification(session),
    ]);
  }

  private async ensureNotification(session: RunningSessionRecord): Promise<void> {
    const settings = this.safeSettings();
    if (settings === null || !settings.notificationsEnabled) return;
    let permission = await this.dependencies.notifications.readPermission();
    if (!permission.ok) return;
    if (permission.value === 'undetermined') {
      permission = await this.dependencies.notifications.requestPermission();
    }
    if (!permission.ok || permission.value !== 'allowed' || this.disposed) return;
    await this.dependencies.notifications.ensure({
      kind: STANDARD_FOCUS_NOTIFICATION_KIND,
      operationKey: standardFocusNotificationKey(session.id),
      sessionId: session.id,
      endsAt: session.endsAt,
      soundEnabled: settings.soundEnabled,
    });
  }

  private async runTerminal(
    sessionId: string,
    freshness: 'fresh_commit' | 'existing_terminal',
  ): Promise<void> {
    const cancel = this.dependencies.notifications.cancel(
      standardFocusNotificationKey(sessionId),
    ).catch(() => undefined);
    if (freshness !== 'fresh_commit') {
      await cancel;
      return;
    }
    const loaded = this.dependencies.loadResult(sessionId).catch(() => null);
    const [, result] = await Promise.all([cancel, loaded]);
    if (result?.ok && result.value.outcome === 'ready') {
      await this.dependencies.analytics.recordTerminal(result.value.result).catch(() => undefined);
    }
  }

  private async handleResponse(response: SessionNotificationResponse): Promise<void> {
    if (
      this.disposed ||
      response.responseId.trim().length === 0 ||
      response.sessionId.trim().length === 0 ||
      (response.kind === STANDARD_FOCUS_NOTIFICATION_KIND &&
        response.operationKey !== standardFocusNotificationKey(response.sessionId)) ||
      (response.kind === BREAK_NOTIFICATION_KIND &&
        response.operationKey !== breakNotificationKey(response.sessionId)) ||
      this.handledResponseIds.has(response.responseId)
    ) return;
    this.handledResponseIds.add(response.responseId);
    if (this.handledResponseIds.size > 64) {
      const oldest = this.handledResponseIds.values().next().value;
      if (typeof oldest === 'string') this.handledResponseIds.delete(oldest);
    }
    try {
      if (response.kind === STANDARD_FOCUS_NOTIFICATION_KIND) {
        await this.dependencies.onNotificationSession(response.sessionId);
      } else {
        await this.dependencies.onBreakNotificationSession?.(response.sessionId);
      }
      await this.dependencies.responses.clearInitial();
    } catch {
      // A later tap/relaunch may retry through durable reconciliation.
    }
  }

  private safeSettings(): StandardFocusSideEffectSettings | null {
    try {
      return this.dependencies.readSettings();
    } catch {
      return null;
    }
  }

  private track(operation: Promise<void>): void {
    this.pending.add(operation);
    void operation.finally(() => this.pending.delete(operation));
  }
}
