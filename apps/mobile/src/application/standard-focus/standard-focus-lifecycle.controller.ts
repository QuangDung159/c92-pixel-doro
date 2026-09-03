import type {
  ApplicationResult,
  PetCompanionController,
  PetTerminalFeedbackController,
  ReconcileStandardFocusError,
  ReconcileStandardFocusOutcome,
  RecordStrictBackgroundError,
  RecordStrictBackgroundOutcome,
  ClockPort,
} from '@pixeldoro/application';

import type { AppLifecycleState } from '../ports/app-lifecycle.port';
import type { CriticalRecoveryPort } from '../recovery';
import type { StandardFocusSessionController } from './standard-focus-session.controller';
import type { StandardFocusOutcomeController } from './standard-focus-outcome.controller';

export interface StandardFocusLifecycleControllerDependencies {
  readonly clock: ClockPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly outcome: StandardFocusOutcomeController;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly session: StandardFocusSessionController;
  recordBackground(capturedAt: number): Promise<
    ApplicationResult<RecordStrictBackgroundOutcome, RecordStrictBackgroundError>
  >;
  reconcile(sessionId?: string): Promise<
    ApplicationResult<ReconcileStandardFocusOutcome, ReconcileStandardFocusError>
  >;
}

export class StandardFocusLifecycleController {
  private operation: Promise<void> = Promise.resolve();
  private lastState: AppLifecycleState;
  private disposed = false;

  constructor(
    private readonly dependencies: StandardFocusLifecycleControllerDependencies,
    initialState: AppLifecycleState,
  ) {
    this.lastState = initialState;
  }

  handleState(state: AppLifecycleState): void {
    if (this.disposed || state === this.lastState) return;
    this.lastState = state;
    const capturedAt = this.dependencies.clock.nowMs();
    if (state !== 'active') this.dependencies.session.setAppVisible(false);
    this.operation = this.operation
      .then(() => state === 'background'
        ? this.recordBackground(capturedAt)
        : state === 'active'
          ? this.reconcileAndReveal()
          : undefined)
      .catch(() => this.enterRecovery('DATABASE_WRITE_FAILED'));
  }

  reconcileNow(sessionId?: string): Promise<void> {
    if (this.disposed) return Promise.resolve();
    const next = this.operation.then(() => this.reconcileAndReveal(sessionId));
    this.operation = next.catch(() => this.enterRecovery('DATABASE_WRITE_FAILED'));
    return this.operation;
  }

  whenIdle(): Promise<void> {
    return this.operation;
  }

  dispose(): void {
    this.disposed = true;
  }

  private async recordBackground(capturedAt: number): Promise<void> {
    const result = await this.dependencies.recordBackground(capturedAt);
    if (!result.ok) this.enterRecovery('DATABASE_WRITE_FAILED');
  }

  private async reconcileAndReveal(sessionId?: string): Promise<void> {
    const result = await this.dependencies.reconcile(sessionId);
    if (!result.ok) {
      this.enterRecovery(
        result.error.code.includes('READ')
          ? 'DATABASE_READ_FAILED'
          : result.error.code.includes('STATE')
            ? 'DURABLE_DATA_CORRUPT'
            : 'DATABASE_WRITE_FAILED',
      );
      return;
    }
    if (result.value.outcome === 'failed' && result.value.freshness === 'fresh_commit') {
      this.dependencies.outcome.publishFreshFailure(
        result.value.sessionId,
        result.value.resolvedAt,
      );
      await this.dependencies.petCompanion.refresh();
      const base = this.dependencies.petCompanion.getSnapshot();
      this.dependencies.petTerminalFeedback.requestFreshTransition({
        sessionId: result.value.sessionId,
        committedAtMs: result.value.resolvedAt,
        sessionType: 'focus',
        focusVariant: 'standard',
        mode: 'strict',
        terminalStatus: 'failed',
        rewardCommitted: false,
      }, {
        currentResultSessionId: result.value.sessionId,
        activeSessionId: base.status === 'ready' ? base.activeSessionId : null,
      });
    }
    await Promise.all([
      this.dependencies.session.refresh(),
      this.dependencies.petCompanion.refresh(),
    ]);
    if (!this.disposed && this.lastState === 'active') {
      this.dependencies.session.setAppVisible(true);
    }
  }

  private enterRecovery(
    reason: Parameters<CriticalRecoveryPort['enterRecovery']>[0],
  ): void {
    if (!this.disposed) this.dependencies.criticalRecovery.enterRecovery(reason);
  }
}
