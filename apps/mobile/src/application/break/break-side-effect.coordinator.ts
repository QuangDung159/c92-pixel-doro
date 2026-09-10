import type { BreakSessionProjection, RunningSessionRecord } from '@pixeldoro/application';

import type { BreakCompletionNotificationPort } from '../notifications';
import { BREAK_NOTIFICATION_KIND, breakNotificationKey,
  isValidBreakNotificationSession } from '../notifications';
import type { BreakAnalyticsRecorderPort } from './break-analytics.recorder';

export interface BreakSideEffectSettings {
  readonly analyticsEnabled: boolean;
  readonly notificationsEnabled: boolean;
  readonly soundEnabled: boolean;
}

export interface BreakSideEffectCoordinatorDependencies {
  readonly analytics: BreakAnalyticsRecorderPort;
  readonly notifications: BreakCompletionNotificationPort;
  readonly readSettings: () => BreakSideEffectSettings | null;
  readonly loadSession: (sessionId: string) => Promise<BreakSessionProjection | null>;
}

export class BreakSideEffectCoordinator {
  private readonly pending = new Set<Promise<void>>();
  private disposed = false;

  constructor(private readonly dependencies: BreakSideEffectCoordinatorDependencies) {}

  afterStarted(session: RunningSessionRecord): void {
    if (this.disposed || !isValidBreakNotificationSession(session)) return;
    this.track(Promise.allSettled([
      this.dependencies.analytics.recordStarted(session),
      this.ensureNotification(session, true),
    ]).then(() => undefined));
  }

  ensureRunning(session: RunningSessionRecord): void {
    if (this.disposed || !isValidBreakNotificationSession(session)) return;
    this.track(this.ensureNotification(session, false));
  }

  afterTerminal(
    sessionId: string,
    status: 'completed' | 'cancelled',
    freshness: 'fresh_commit' | 'existing_terminal' | 'recovery_commit',
  ): void {
    if (this.disposed || !sessionId.trim()) return;
    this.track(this.runTerminal(sessionId, status, freshness));
  }

  async whenIdle(): Promise<void> {
    while (this.pending.size > 0) await Promise.allSettled([...this.pending]);
  }

  dispose(): void { this.disposed = true; }

  private async ensureNotification(session: RunningSessionRecord, mayRequest: boolean): Promise<void> {
    const settings = this.safeSettings();
    if (settings === null || !settings.notificationsEnabled) return;
    let permission = await this.dependencies.notifications.readPermission().catch(() => null);
    if (permission?.ok && permission.value === 'undetermined' && mayRequest) {
      permission = await this.dependencies.notifications.requestPermission().catch(() => null);
    }
    if (!permission?.ok || permission.value !== 'allowed' || this.disposed) return;
    await this.dependencies.notifications.ensure({
      kind: BREAK_NOTIFICATION_KIND,
      operationKey: breakNotificationKey(session.id),
      sessionId: session.id,
      endsAt: session.endsAt,
      soundEnabled: settings.soundEnabled,
      breakType: session.sessionType as 'short_break' | 'long_break',
    }).catch(() => undefined);
  }

  private async runTerminal(
    sessionId: string,
    status: 'completed' | 'cancelled',
    freshness: 'fresh_commit' | 'existing_terminal' | 'recovery_commit',
  ): Promise<void> {
    const cancel = this.dependencies.notifications.cancel(breakNotificationKey(sessionId))
      .catch(() => undefined);
    if (status !== 'completed' || freshness !== 'fresh_commit') { await cancel; return; }
    const [, session] = await Promise.all([
      cancel,
      this.dependencies.loadSession(sessionId).catch(() => null),
    ]);
    if (session?.status === 'completed') {
      await this.dependencies.analytics.recordCompleted(session).catch(() => undefined);
    }
  }

  private safeSettings(): BreakSideEffectSettings | null {
    try { return this.dependencies.readSettings(); } catch { return null; }
  }

  private track(operation: Promise<void>): void {
    this.pending.add(operation);
    void operation.finally(() => this.pending.delete(operation));
  }
}
