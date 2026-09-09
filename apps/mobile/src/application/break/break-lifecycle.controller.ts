import type {
  ApplicationResult, PetCompanionController, ReconcileBreakError, ReconcileBreakOutcome,
} from '@pixeldoro/application';
import type { AppLifecycleState } from '../ports/app-lifecycle.port';
import type { CriticalRecoveryPort } from '../recovery';
import type { BreakOutcomeController } from './break-outcome.controller';
import type { BreakSessionController } from './break-session.controller';

export interface BreakLifecycleControllerDependencies {
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly outcome: BreakOutcomeController;
  readonly petCompanion: PetCompanionController;
  readonly session: BreakSessionController;
  reconcile(sessionId?: string): Promise<ApplicationResult<ReconcileBreakOutcome, ReconcileBreakError>>;
}

export class BreakLifecycleController {
  private operation: Promise<void> = Promise.resolve();
  private lastState: AppLifecycleState;
  private disposed = false;
  constructor(private readonly dependencies: BreakLifecycleControllerDependencies, initialState: AppLifecycleState) {
    this.lastState = initialState;
  }
  handleState(state: AppLifecycleState): void {
    if (this.disposed || state === this.lastState) return;
    this.lastState = state;
    if (state === 'background') { this.dependencies.session.setAppVisible(false); return; }
    this.operation = this.operation.then(() => this.reconcileAndReveal())
      .catch(() => this.enterRecovery('DATABASE_WRITE_FAILED'));
  }
  reconcileNow(sessionId?: string): Promise<void> {
    if (this.disposed) return Promise.resolve();
    const next = this.operation.then(() => this.reconcileAndReveal(sessionId));
    this.operation = next.catch(() => this.enterRecovery('DATABASE_WRITE_FAILED'));
    return this.operation;
  }
  whenIdle(): Promise<void> { return this.operation; }
  dispose(): void { this.disposed = true; }

  private async reconcileAndReveal(sessionId?: string): Promise<void> {
    const result = await this.dependencies.reconcile(sessionId);
    if (!result.ok) {
      this.enterRecovery(result.error.code.includes('READ') ? 'DATABASE_READ_FAILED'
        : result.error.code.includes('STATE') ? 'DURABLE_DATA_CORRUPT' : 'DATABASE_WRITE_FAILED');
      return;
    }
    if (this.disposed) return;
    const value = result.value;
    if (value.outcome === 'completed') {
      this.dependencies.outcome.publishCompleted(value.sessionId, value.resolvedAt);
      await Promise.all([
        this.dependencies.session.refresh(value.sessionId),
        this.dependencies.petCompanion.refresh().catch(() => undefined),
      ]);
    } else if (value.outcome === 'running') {
      await Promise.all([
        this.dependencies.session.refresh(value.sessionId),
        this.dependencies.petCompanion.refresh().catch(() => undefined),
      ]);
    }
    if (!this.disposed && this.lastState === 'active') this.dependencies.session.setAppVisible(true);
  }
  private enterRecovery(reason: Parameters<CriticalRecoveryPort['enterRecovery']>[0]): void {
    if (!this.disposed) this.dependencies.criticalRecovery.enterRecovery(reason);
  }
}
