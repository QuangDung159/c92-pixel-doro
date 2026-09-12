import type {
  ApplicationResult,
  ContributionRangeProjection,
  LoadDailyContributionError,
} from '@pixeldoro/application';

import type { CriticalRecoveryPort } from '../recovery';
import type {
  ContributionControllerProjection,
  ContributionRefreshState,
} from './contribution-projection';

interface ContributionLoader {
  execute(): Promise<ApplicationResult<ContributionRangeProjection, LoadDailyContributionError>>;
}

export interface ContributionControllerDependencies {
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly loader: ContributionLoader;
}

export class ContributionController {
  private projection: ContributionControllerProjection = { status: 'idle' };
  private committed: ContributionRangeProjection | undefined;
  private readonly listeners = new Set<() => void>();
  private active = false;
  private disposed = false;
  private generation = 0;
  private loadPromise: Promise<void> | undefined;

  constructor(private readonly dependencies: ContributionControllerDependencies) {}

  getSnapshot = (): ContributionControllerProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.active) return this.loadPromise ?? Promise.resolve();
    this.active = true;
    return this.committed === undefined ? this.startInitial() : this.startRefresh();
  };

  deactivate = (): void => {
    if (this.disposed || !this.active) return;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    if (this.committed !== undefined) this.publishCommitted('idle');
  };

  refresh = (): Promise<void> => {
    if (this.disposed || !this.active) return Promise.resolve();
    return this.loadPromise ??
      (this.committed === undefined ? this.startInitial() : this.startRefresh());
  };

  retryInitial = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.loadPromise !== undefined ||
      this.committed !== undefined || this.projection.status !== 'error'
    ) return Promise.resolve();
    return this.startInitial();
  };

  retryRefresh = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.loadPromise !== undefined ||
      this.committed === undefined || this.projection.status !== 'ready' ||
      this.projection.refresh !== 'error'
    ) return Promise.resolve();
    return this.startRefresh();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    this.listeners.clear();
  }

  private startInitial(): Promise<void> {
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    return this.run(generation, false);
  }

  private startRefresh(): Promise<void> {
    const generation = ++this.generation;
    this.publishCommitted('refreshing');
    return this.run(generation, true);
  }

  private run(generation: number, refreshing: boolean): Promise<void> {
    const operation = this.dependencies.loader.execute()
      .then((result) => {
        if (!this.isCurrent(generation)) return;
        if (result.ok) {
          this.committed = result.value;
          this.publishCommitted('idle');
          return;
        }
        if (result.error.code === 'CONTRIBUTION_DATA_INVALID') {
          this.enterInvalidRecovery(generation);
          return;
        }
        if (refreshing && this.committed !== undefined) {
          this.publishCommitted('error');
        } else {
          this.publish({ status: 'error', code: result.error.code });
        }
      })
      .catch(() => {
        if (!this.isCurrent(generation)) return;
        if (refreshing && this.committed !== undefined) {
          this.publishCommitted('error');
        } else {
          this.publish({ status: 'error', code: 'CONTRIBUTION_READ_FAILED' });
        }
      })
      .finally(() => {
        if (this.loadPromise === operation) this.loadPromise = undefined;
      });
    this.loadPromise = operation;
    return operation;
  }

  private enterInvalidRecovery(generation: number): void {
    if (!this.isCurrent(generation)) return;
    if (this.committed === undefined) {
      this.publish({ status: 'error', code: 'CONTRIBUTION_DATA_INVALID' });
    } else {
      this.publishCommitted('idle');
    }
    this.dependencies.criticalRecovery.enterRecovery('DURABLE_DATA_CORRUPT');
  }

  private publishCommitted(refresh: ContributionRefreshState): void {
    if (this.committed === undefined) return;
    this.publish({ status: 'ready', value: this.committed, refresh });
  }

  private isCurrent(generation: number): boolean {
    return this.active && !this.disposed && this.generation === generation;
  }

  private publish(projection: ContributionControllerProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot alter committed Contribution truth.
      }
    });
  }
}
