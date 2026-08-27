import type {
  CreateFoundationSnapshotUseCase,
  FoundationSnapshot,
} from '@pixeldoro/application';

import type { AppLifecyclePort, AppLifecycleState } from '../ports/app-lifecycle.port';
import type {
  DatabaseLifecycleErrorCode,
  DatabaseLifecyclePort,
} from '../ports/database-lifecycle.port';

export type BootstrapProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'booting' }
  | {
      readonly status: 'ready';
      readonly foundation: FoundationSnapshot;
      readonly lifecycleState: AppLifecycleState;
    }
  | {
      readonly status: 'recovery';
      readonly error: {
        readonly code: 'FOUNDATION_BOOT_FAILED' | DatabaseLifecycleErrorCode;
      };
    };

export interface MobileBootstrapDependencies {
  readonly appLifecycle: AppLifecyclePort;
  readonly createFoundationSnapshot: CreateFoundationSnapshotUseCase;
  readonly databaseLifecycle: DatabaseLifecyclePort;
}

export class MobileBootstrap {
  private projection: BootstrapProjection = { status: 'idle' };
  private unsubscribeLifecycle: (() => void) | undefined;
  private listeners = new Set<() => void>();
  private bootPromise: Promise<void> | undefined;
  private disposePromise: Promise<void> | undefined;
  private generation = 0;

  constructor(private readonly dependencies: MobileBootstrapDependencies) {}

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
    this.updateProjection({ status: 'booting' });
    const operation = this.runBoot(generation);
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
    const operation = this.runDispose();
    this.disposePromise = operation;

    const clearDisposePromise = () => {
      if (this.disposePromise === operation) {
        this.disposePromise = undefined;
      }
    };
    void operation.then(clearDisposePromise, clearDisposePromise);

    return operation;
  }

  private async runBoot(generation: number): Promise<void> {
    let databaseResult;

    try {
      databaseResult = await this.dependencies.databaseLifecycle.open();
    } catch {
      if (generation === this.generation) {
        this.updateProjection({
          status: 'recovery',
          error: { code: 'DATABASE_OPEN_FAILED' },
        });
      }
      return;
    }

    if (generation !== this.generation) {
      return;
    }

    if (!databaseResult.ok) {
      this.updateProjection({
        status: 'recovery',
        error: { code: databaseResult.error.code },
      });
      return;
    }

    try {
      const result = this.dependencies.createFoundationSnapshot.execute();

      if (!result.ok) {
        this.updateProjection({
          status: 'recovery',
          error: { code: 'FOUNDATION_BOOT_FAILED' },
        });
        return;
      }

      this.updateProjection({
        status: 'ready',
        foundation: result.value,
        lifecycleState: 'active',
      });

      this.unsubscribeLifecycle = this.dependencies.appLifecycle.subscribe((lifecycleState) => {
        const current = this.projection;

        if (current.status === 'ready') {
          this.updateProjection({ ...current, lifecycleState });
        }
      });
    } catch {
      this.updateProjection({
        status: 'recovery',
        error: { code: 'FOUNDATION_BOOT_FAILED' },
      });
    }
  }

  private async runDispose(): Promise<void> {
    await this.bootPromise;
    this.unsubscribeLifecycle?.();
    this.unsubscribeLifecycle = undefined;
    try {
      await this.dependencies.databaseLifecycle.close();
    } catch {
      // Dispose must not leak a raw native/provider exception into React cleanup.
    } finally {
      this.listeners.clear();
      this.projection = { status: 'idle' };
    }
  }

  private updateProjection(projection: BootstrapProjection): void {
    this.projection = projection;
    this.listeners.forEach((listener) => listener());
  }
}
