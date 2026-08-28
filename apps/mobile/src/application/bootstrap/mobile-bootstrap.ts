import type { AppLifecyclePort, AppLifecycleState } from '../ports/app-lifecycle.port';
import type {
  BootstrapDataPort,
  BootstrapDurableSnapshot,
} from '../ports/bootstrap-data.port';
import type { BootstrapVerifierPort } from '../ports/bootstrap-verifier.port';
import type {
  DatabaseLifecycleErrorCode,
  DatabaseLifecyclePort,
} from '../ports/database-lifecycle.port';
import type { MigrationPort } from '../ports/migration.port';
import type { StartupReconciliationPort } from '../ports/startup-reconciliation.port';
import type { ReadinessController } from '../readiness/readiness-gate';

export type BootstrapPhase =
  | 'opening'
  | 'migrating'
  | 'verifying'
  | 'hydrating'
  | 'reconciling';

export type BootstrapErrorCode =
  | DatabaseLifecycleErrorCode
  | 'BOOTSTRAP_MIGRATION_FAILED'
  | 'BOOTSTRAP_INVARIANT_FAILED'
  | 'BOOTSTRAP_DATA_INVALID'
  | 'STARTUP_RECONCILIATION_FAILED';

export type BootstrapProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'booting'; readonly phase: BootstrapPhase }
  | {
      readonly status: 'ready';
      readonly snapshot: BootstrapDurableSnapshot;
      readonly lifecycleState: AppLifecycleState;
    }
  | {
      readonly status: 'recovery';
      readonly phase: BootstrapPhase;
      readonly error: { readonly code: BootstrapErrorCode };
    }
  | { readonly status: 'disposed' };

export interface MobileBootstrapDependencies {
  readonly appLifecycle: AppLifecyclePort;
  readonly bootstrapData: BootstrapDataPort;
  readonly bootstrapVerifier: BootstrapVerifierPort;
  readonly databaseLifecycle: DatabaseLifecyclePort;
  readonly migration: MigrationPort;
  readonly readiness: ReadinessController;
  readonly startupReconciliation: StartupReconciliationPort;
}

export class MobileBootstrap {
  private projection: BootstrapProjection = { status: 'idle' };
  private unsubscribeLifecycle: (() => void) | undefined;
  private listeners = new Set<() => void>();
  private bootPromise: Promise<void> | undefined;
  private disposePromise: Promise<void> | undefined;
  private generation = 0;
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
    if (this.bootPromise !== undefined) {
      return this.bootPromise;
    }

    if (this.projection.status !== 'idle') {
      return Promise.resolve();
    }

    const generation = ++this.generation;
    this.dependencies.readiness.close();
    this.updateProjection({ status: 'booting', phase: 'opening' });
    const operation = this.runAttempt(generation);
    this.bootPromise = operation;

    const clearBootPromise = () => {
      if (this.bootPromise === operation) {
        this.bootPromise = undefined;
      }
    };
    void operation.then(clearBootPromise, clearBootPromise);

    return operation;
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

  private async runAttempt(generation: number): Promise<void> {
    try {
      const databaseResult = await this.dependencies.databaseLifecycle.open();
      if (!this.isCurrent(generation)) return;
      if (!databaseResult.ok) {
        this.recover('opening', databaseResult.error.code);
        return;
      }

      this.updateProjection({ status: 'booting', phase: 'migrating' });
      const migrationResult = await this.dependencies.migration.migrate();
      if (!this.isCurrent(generation)) return;
      if (!migrationResult.ok) {
        this.recover('migrating', 'BOOTSTRAP_MIGRATION_FAILED');
        return;
      }

      this.updateProjection({ status: 'booting', phase: 'verifying' });
      const verificationResult =
        await this.dependencies.bootstrapVerifier.verify();
      if (!this.isCurrent(generation)) return;
      if (!verificationResult.ok) {
        this.recover('verifying', verificationResult.error.code);
        return;
      }

      this.updateProjection({ status: 'booting', phase: 'hydrating' });
      const dataResult = await this.dependencies.bootstrapData.read();
      if (!this.isCurrent(generation)) return;
      if (!dataResult.ok) {
        this.recover('hydrating', dataResult.error.code);
        return;
      }

      this.updateProjection({ status: 'booting', phase: 'reconciling' });
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
    } catch {
      if (!this.isCurrent(generation)) return;
      const current = this.projection;
      const phase = current.status === 'booting' ? current.phase : 'opening';
      this.recover(phase, this.errorCodeFor(phase));
    }
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
      await this.bootPromise;
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

  private recover(phase: BootstrapPhase, code: BootstrapErrorCode): void {
    this.dependencies.readiness.close();
    this.updateProjection({ status: 'recovery', phase, error: { code } });
  }

  private errorCodeFor(phase: BootstrapPhase): BootstrapErrorCode {
    switch (phase) {
      case 'opening':
        return 'DATABASE_OPEN_FAILED';
      case 'migrating':
        return 'BOOTSTRAP_MIGRATION_FAILED';
      case 'verifying':
        return 'BOOTSTRAP_INVARIANT_FAILED';
      case 'hydrating':
        return 'BOOTSTRAP_DATA_INVALID';
      case 'reconciling':
        return 'STARTUP_RECONCILIATION_FAILED';
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
