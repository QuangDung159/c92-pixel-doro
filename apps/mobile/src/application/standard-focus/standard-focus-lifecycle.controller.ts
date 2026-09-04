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
import { requestStandardTerminalFeedback } from './request-standard-terminal-feedback';

export interface StandardFocusLifecycleControllerDependencies {
  readonly clock: ClockPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly outcome: StandardFocusOutcomeController;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly session: StandardFocusSessionController;
  refreshProfile(): Promise<boolean>;
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
    if (this.disposed) return;
    if ((result.value.outcome === 'completed' || result.value.outcome === 'failed') &&
      result.value.freshness === 'fresh_commit') {
      if (result.value.outcome === 'completed') {
        if (!await this.dependencies.refreshProfile().catch(() => false)) {
          // Keep the committed identity even when hydration must go through recovery.
          this.dependencies.outcome.publishFreshCompletion(result.value.result);
          this.enterRecovery('DATABASE_READ_FAILED');
          return;
        }
      }
      await this.dependencies.petCompanion.refresh().catch(() => undefined);
      if (this.disposed) return;
      // Publish only after hydration, then request feedback synchronously: Result must
      // not consume the handoff while these post-commit reads are still in flight.
      if (result.value.outcome === 'completed') this.dependencies.outcome.publishFreshCompletion(result.value.result);
      else this.dependencies.outcome.publishFreshFailure(result.value.sessionId, result.value.resolvedAt);
      requestStandardTerminalFeedback(this.dependencies.outcome.getSnapshot(),
        this.dependencies.petCompanion, this.dependencies.petTerminalFeedback);
    }
    await Promise.all([
      this.dependencies.session.refresh(),
      this.dependencies.petCompanion.refresh().catch(() => undefined),
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
