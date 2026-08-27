import type {
  CreateFoundationSnapshotUseCase,
  FoundationSnapshot,
} from '@pixeldoro/application';

import type { AppLifecyclePort, AppLifecycleState } from '../ports/app-lifecycle.port';

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
      readonly error: { readonly code: 'FOUNDATION_BOOT_FAILED' };
    };

export interface MobileBootstrapDependencies {
  readonly appLifecycle: AppLifecyclePort;
  readonly createFoundationSnapshot: CreateFoundationSnapshotUseCase;
}

export class MobileBootstrap {
  private projection: BootstrapProjection = { status: 'idle' };
  private unsubscribeLifecycle: (() => void) | undefined;
  private listeners = new Set<() => void>();

  constructor(private readonly dependencies: MobileBootstrapDependencies) {}

  getSnapshot = (): BootstrapProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  boot(): void {
    if (this.projection.status !== 'idle') {
      return;
    }

    this.updateProjection({ status: 'booting' });

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

  dispose(): void {
    this.unsubscribeLifecycle?.();
    this.unsubscribeLifecycle = undefined;
    this.listeners.clear();
    this.projection = { status: 'idle' };
  }

  private updateProjection(projection: BootstrapProjection): void {
    this.projection = projection;
    this.listeners.forEach((listener) => listener());
  }
}

