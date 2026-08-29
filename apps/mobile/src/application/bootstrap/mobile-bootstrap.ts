import type { AppLifecyclePort, AppLifecycleState } from '../ports/app-lifecycle.port';
import type {
  BootstrapDataPort,
  BootstrapDurableSnapshot,
} from '../ports/bootstrap-data.port';
import type { BootstrapVerifierPort } from '../ports/bootstrap-verifier.port';
import type { DatabaseLifecyclePort } from '../ports/database-lifecycle.port';
import type { MigrationPort, MigrationRunError } from '../ports/migration.port';
import type { StartupReconciliationPort } from '../ports/startup-reconciliation.port';
import type { ReadinessController } from '../readiness/readiness-gate';
import type {
  BootstrapPhase,
  CriticalRecoveryPort,
  RecoveryDiagnostic,
  RecoveryDiagnosticsPort,
  RecoveryPhase,
  RecoveryReasonCode,
  RuntimeRecoveryReasonCode,
} from '../recovery';

export type BootstrapProjection =
  | { readonly status: 'idle' }
  | {
      readonly status: 'booting';
      readonly phase: BootstrapPhase;
    }
  | {
      readonly status: 'ready';
      readonly snapshot: BootstrapDurableSnapshot;
      readonly lifecycleState: AppLifecycleState;
    }
  | {
      readonly status: 'recovery';
      readonly phase: RecoveryPhase;
      readonly error: { readonly code: RecoveryReasonCode };
    }
  | { readonly status: 'disposed' };

export interface MobileBootstrapDependencies {
  readonly appLifecycle: AppLifecyclePort;
  readonly bootstrapData: BootstrapDataPort;
  readonly bootstrapVerifier: BootstrapVerifierPort;
  readonly databaseLifecycle: DatabaseLifecyclePort;
  readonly diagnostics: RecoveryDiagnosticsPort;
  readonly migration: MigrationPort;
  readonly readiness: ReadinessController;
  readonly startupReconciliation: StartupReconciliationPort;
}

const migrationRecoveryReason = (
  error: MigrationRunError,
): RecoveryReasonCode =>
  error.kind === 'migration_error'
    ? error.code
    : 'MIGRATION_EXECUTION_FAILED';

export class MobileBootstrap implements CriticalRecoveryPort {
  private projection: BootstrapProjection = { status: 'idle' };
  private unsubscribeLifecycle: (() => void) | undefined;
  private listeners = new Set<() => void>();
  private attemptPromise: Promise<void> | undefined;
  private disposePromise: Promise<void> | undefined;
  private generation = 0;
  private attemptNumber = 0;
  private lifecycleState: AppLifecycleState = 'background';

  constructor(private readonly dependencies: MobileBootstrapDependencies) {
    this.dependencies.readiness.close();
  }

  getSnapshot = (): BootstrapProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  boot(): Promise<void> {
    if (this.attemptPromise !== undefined) {
      return this.attemptPromise;
    }

    if (this.projection.status !== 'idle') {
      return Promise.resolve();
    }

    return this.startAttempt(false);
  }

  retry(): Promise<void> {
    if (this.attemptPromise !== undefined) {
      return this.attemptPromise;
    }

    if (this.projection.status !== 'recovery') {
      return Promise.resolve();
    }

    const previousFailure = {
      phase: this.projection.phase,
      reasonCode: this.projection.error.code,
    };
    return this.startAttempt(true, previousFailure);
  }

  enterRecovery(reasonCode: RuntimeRecoveryReasonCode): void {
    if (this.projection.status !== 'ready') {
      return;
    }

    this.recover('runtime', reasonCode);
  }

  dispose(): Promise<void> {
    if (this.disposePromise !== undefined) {
      return this.disposePromise;
    }

    this.generation += 1;
    this.dependencies.readiness.close();
    this.updateProjection({ status: 'disposed' });
    const operation = this.runDispose();
    this.disposePromise = operation;
    return operation;
  }

  private startAttempt(
    recycleConnection: boolean,
    previousFailure?: {
      readonly phase: RecoveryPhase;
      readonly reasonCode: RecoveryReasonCode;
    },
  ): Promise<void> {
    const generation = ++this.generation;
    this.attemptNumber += 1;
    const attemptNumber = this.attemptNumber;
    this.dependencies.readiness.close();

    if (previousFailure !== undefined) {
      this.recordDiagnostic({
        eventName: 'recovery_retry_started',
        attemptNumber,
        phase: previousFailure.phase,
        reasonCode: previousFailure.reasonCode,
      });
    }

    this.updateProjection({
      status: 'booting',
      phase: 'opening',
    });
    const operation = this.runAttempt(
      generation,
      attemptNumber,
      recycleConnection,
    );
    this.attemptPromise = operation;

    const clearAttemptPromise = () => {
      if (this.attemptPromise === operation) {
        this.attemptPromise = undefined;
      }
    };
    void operation.then(clearAttemptPromise, clearAttemptPromise);

    return operation;
  }

  private async runAttempt(
    generation: number,
    attemptNumber: number,
    recycleConnection: boolean,
  ): Promise<void> {
    try {
      if (recycleConnection) {
        const closeResult = await this.dependencies.databaseLifecycle.close();
        if (!this.isCurrent(generation)) return;
        if (!closeResult.ok) {
          this.recover('opening', 'DATABASE_UNAVAILABLE');
          return;
        }
      }

      const databaseResult = await this.dependencies.databaseLifecycle.open();
      if (!this.isCurrent(generation)) return;
      if (!databaseResult.ok) {
        this.recover('opening', 'DATABASE_OPEN_FAILED');
        return;
      }

      this.updateBooting('migrating');
      const migrationResult = await this.dependencies.migration.migrate();
      if (!this.isCurrent(generation)) return;
      if (!migrationResult.ok) {
        this.recover('migrating', migrationRecoveryReason(migrationResult.error));
        return;
      }

      this.updateBooting('verifying');
      const verificationResult =
        await this.dependencies.bootstrapVerifier.verify();
      if (!this.isCurrent(generation)) return;
      if (!verificationResult.ok) {
        this.recover('verifying', verificationResult.error.code);
        return;
      }

      this.updateBooting('hydrating');
      const dataResult = await this.dependencies.bootstrapData.read();
      if (!this.isCurrent(generation)) return;
      if (!dataResult.ok) {
        this.recover('hydrating', dataResult.error.code);
        return;
      }

      this.updateBooting('reconciling');
      this.startLifecycleSubscription();
      const reconciliationResult =
        await this.dependencies.startupReconciliation.reconcileAtStartup();
      if (!this.isCurrent(generation)) return;
      if (!reconciliationResult.ok) {
        this.recover('reconciling', reconciliationResult.error.code);
        return;
      }

      this.dependencies.readiness.open();
      this.updateProjection({
        status: 'ready',
        snapshot: dataResult.value,
        lifecycleState: this.lifecycleState,
      });

      if (recycleConnection) {
        this.recordDiagnostic({
          eventName: 'recovery_retry_succeeded',
          attemptNumber,
          phase: 'reconciling',
          reasonCode: null,
        });
      }
    } catch {
      if (!this.isCurrent(generation)) return;
      const current = this.projection;
      const phase = current.status === 'booting' ? current.phase : 'opening';
      this.recover(phase, this.unexpectedReasonFor(phase));
    }
  }

  private updateBooting(phase: BootstrapPhase): void {
    this.updateProjection({ status: 'booting', phase });
  }

  private startLifecycleSubscription(): void {
    if (this.unsubscribeLifecycle !== undefined) {
      return;
    }

    this.lifecycleState = this.dependencies.appLifecycle.getCurrentState();
    this.unsubscribeLifecycle = this.dependencies.appLifecycle.subscribe((state) => {
      this.lifecycleState = state;
      const current = this.projection;
      if (current.status === 'ready') {
        this.updateProjection({ ...current, lifecycleState: state });
      }
    });
  }

  private async runDispose(): Promise<void> {
    try {
      await this.attemptPromise;
    } catch {
      // Bootstrap maps provider failures to recovery; cleanup still proceeds.
    }

    this.unsubscribeLifecycle?.();
    this.unsubscribeLifecycle = undefined;
    try {
      await this.dependencies.databaseLifecycle.close();
    } catch {
      // React cleanup must not receive raw native/provider exceptions.
    } finally {
      this.listeners.clear();
      this.projection = { status: 'disposed' };
    }
  }

  private recover(phase: RecoveryPhase, code: RecoveryReasonCode): void {
    this.dependencies.readiness.close();
    this.updateProjection({
      status: 'recovery',
      phase,
      error: { code },
    });
    this.recordDiagnostic({
      eventName: 'recovery_entered',
      attemptNumber: this.attemptNumber,
      phase,
      reasonCode: code,
    });
  }

  private unexpectedReasonFor(phase: BootstrapPhase): RecoveryReasonCode {
    switch (phase) {
      case 'opening':
        return 'DATABASE_OPEN_FAILED';
      case 'migrating':
        return 'MIGRATION_EXECUTION_FAILED';
      case 'verifying':
      case 'hydrating':
        return 'DATABASE_READ_FAILED';
      case 'reconciling':
        return 'STARTUP_RECONCILIATION_FAILED';
    }
  }

  private recordDiagnostic(diagnostic: RecoveryDiagnostic): void {
    try {
      this.dependencies.diagnostics.record(diagnostic);
    } catch {
      // Diagnostics are best effort and never change durable readiness/recovery truth.
    }
  }

  private isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  private updateProjection(projection: BootstrapProjection): void {
    this.projection = projection;
    this.listeners.forEach((listener) => listener());
  }
}
