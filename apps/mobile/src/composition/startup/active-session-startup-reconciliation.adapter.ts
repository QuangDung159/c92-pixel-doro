import {
  isRunningStandardFocus,
  type ApplicationResult,
  type ReconcileStandardFocusError,
  type ReconcileStandardFocusOutcome,
  type SessionRepository,
  type StandardFocusCompletedResult,
} from '@pixeldoro/application';
import {
  startupReconciliationError,
  type StartupReconciliationPort,
} from '@/application';

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
        } else if (standard.value.outcome === 'failed') {
          standardChanged = standard.value.freshness === 'fresh_commit';
          if (standardChanged) {
            this.standard.publishFreshFailure(
              standard.value.sessionId,
              standard.value.resolvedAt,
            );
          }
        } else if (standard.value.outcome === 'safe_episode_cleared') {
          standardChanged = true;
        }
      }
      const active = await this.sessions.findActive();
      if (!active.ok) return { ok: false, error: startupReconciliationError() };
      if (
        active.value !== null &&
        active.value.focusVariant === 'standard' &&
        !isRunningStandardFocus(active.value)
      ) {
        return { ok: false, error: startupReconciliationError() };
      }
      return {
        ok: true,
        value: {
          durableDataChanged:
            reconciled.value.durableDataChanged || standardChanged,
        },
      };
    } catch {
      return { ok: false, error: startupReconciliationError() };
    }
  }
}
