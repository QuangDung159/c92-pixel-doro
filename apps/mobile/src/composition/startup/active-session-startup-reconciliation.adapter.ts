import {
  isRunningBreak,
  isRunningStandardFocus,
  type ApplicationResult,
  type ReconcileBreakError,
  type ReconcileBreakOutcome,
  type ReconcileStandardFocusError,
  type ReconcileStandardFocusOutcome,
  type RunningSessionRecord,
  type SessionRepository,
  type StandardFocusCompletedResult,
} from '@pixeldoro/application';
import {
  startupReconciliationError,
  type StartupReconciliationPort,
} from '@/application';

const bestEffort = (action: (() => void) | undefined): void => {
  try {
    action?.();
  } catch {
    // Startup durable truth cannot depend on notification/analytics dispatch.
  }
};

export class ActiveSessionStartupReconciliationAdapter implements StartupReconciliationPort {
  constructor(
    private readonly delegate: StartupReconciliationPort,
    private readonly sessions: Pick<SessionRepository, 'findActive'>,
    private readonly standard?: {
      reconcile(): Promise<
        ApplicationResult<ReconcileStandardFocusOutcome, ReconcileStandardFocusError>
      >;
      publishFreshFailure(sessionId: string, resolvedAt: number): void;
      publishFreshCompletion(result: StandardFocusCompletedResult): void;
      ensureRunning?(session: RunningSessionRecord): void;
      afterTerminal?(
        sessionId: string,
        freshness: 'fresh_commit' | 'existing_terminal',
      ): void;
    },
    private readonly breakLifecycle?: {
      reconcile(): Promise<ApplicationResult<ReconcileBreakOutcome, ReconcileBreakError>>;
      publishCompleted(sessionId: string, resolvedAt: number): void;
    },
  ) {}

  async reconcileAtStartup(): ReturnType<StartupReconciliationPort['reconcileAtStartup']> {
    const reconciled = await this.delegate.reconcileAtStartup();
    if (!reconciled.ok) return reconciled;
    try {
      let standardChanged = false;
      if (this.standard !== undefined) {
        const standard = await this.standard.reconcile();
        if (!standard.ok) return { ok: false, error: startupReconciliationError() };
        if (standard.value.outcome === 'completed') {
          standardChanged = standard.value.freshness === 'fresh_commit';
          if (standardChanged) this.standard.publishFreshCompletion(standard.value.result);
          const { sessionId, freshness } = standard.value;
          bestEffort(() => this.standard?.afterTerminal?.(
            sessionId,
            freshness,
          ));
        } else if (standard.value.outcome === 'failed') {
          standardChanged = standard.value.freshness === 'fresh_commit';
          if (standardChanged) {
            this.standard.publishFreshFailure(
              standard.value.sessionId,
              standard.value.resolvedAt,
            );
          }
          const { sessionId, freshness } = standard.value;
          bestEffort(() => this.standard?.afterTerminal?.(
            sessionId,
            freshness,
          ));
        } else if (standard.value.outcome === 'terminal_winner') {
          const { sessionId } = standard.value;
          bestEffort(() => this.standard?.afterTerminal?.(
            sessionId,
            'existing_terminal',
          ));
        } else if (standard.value.outcome === 'safe_episode_cleared') {
          standardChanged = true;
        }
      }
      let breakChanged = false;
      if (this.breakLifecycle !== undefined) {
        const breakResult = await this.breakLifecycle.reconcile();
        if (!breakResult.ok) return { ok: false, error: startupReconciliationError() };
        if (breakResult.value.outcome === 'completed') {
          breakChanged = breakResult.value.freshness === 'fresh_commit';
          this.breakLifecycle.publishCompleted(
            breakResult.value.sessionId,
            breakResult.value.resolvedAt,
          );
        }
      }
      const active = await this.sessions.findActive();
      if (!active.ok) return { ok: false, error: startupReconciliationError() };
      if (active.value !== null && !isRunningStandardFocus(active.value) &&
        !isRunningBreak(active.value)) {
        return { ok: false, error: startupReconciliationError() };
      }
      if (active.value !== null && isRunningStandardFocus(active.value)) {
        const running = active.value;
        bestEffort(() => this.standard?.ensureRunning?.(running));
      }
      return {
        ok: true,
        value: {
          durableDataChanged:
            reconciled.value.durableDataChanged || standardChanged || breakChanged,
        },
      };
    } catch {
      return { ok: false, error: startupReconciliationError() };
    }
  }
}
