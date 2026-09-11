import type {
  ApplicationResult,
  FocusHistoryFirstPageProjection,
  FocusHistoryItemProjection,
  LoadFocusHistoryPageError,
} from '@pixeldoro/application';

import type { CriticalRecoveryPort } from '../recovery';

interface HistoryPageLoader {
  execute(): Promise<
    ApplicationResult<FocusHistoryFirstPageProjection, LoadFocusHistoryPageError>
  >;
}

export type HistoryControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | {
      readonly status: 'ready';
      readonly items: readonly FocusHistoryItemProjection[];
      readonly hasMore: boolean;
    }
  | {
      readonly status: 'error';
      readonly code: 'HISTORY_READ_FAILED' | 'HISTORY_DATA_INVALID';
    };

export interface HistoryControllerDependencies {
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly loader: HistoryPageLoader;
}

export class HistoryController {
  private projection: HistoryControllerProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private active = false;
  private disposed = false;
  private generation = 0;
  private loadPromise: Promise<void> | undefined;

  constructor(private readonly dependencies: HistoryControllerDependencies) {}

  getSnapshot = (): HistoryControllerProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.active) return this.loadPromise ?? Promise.resolve();
    this.active = true;
    if (
      this.projection.status === 'ready' ||
      this.projection.status === 'empty' ||
      this.projection.status === 'error'
    ) return Promise.resolve();
    return this.load(++this.generation);
  };

  deactivate = (): void => {
    if (this.disposed || !this.active) return;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
  };

  retry = (): Promise<void> => {
    if (this.disposed || !this.active) return Promise.resolve();
    if (this.loadPromise !== undefined) return this.loadPromise;
    if (this.projection.status !== 'error') return Promise.resolve();
    return this.load(this.generation);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    this.listeners.clear();
  }

  private load(generation: number): Promise<void> {
    this.publish({ status: 'loading' });
    const operation = this.dependencies.loader.execute()
      .then((result) => {
        if (!this.isCurrent(generation)) return;
        if (result.ok) {
          this.publish(result.value.items.length === 0
            ? { status: 'empty' }
            : {
                status: 'ready',
                items: result.value.items,
                hasMore: result.value.nextCursor !== null,
              });
          return;
        }
        this.publish({ status: 'error', code: result.error.code });
        if (result.error.code === 'HISTORY_DATA_INVALID') {
          this.dependencies.criticalRecovery.enterRecovery('DURABLE_DATA_CORRUPT');
        }
      })
      .catch(() => {
        if (this.isCurrent(generation)) {
          this.publish({ status: 'error', code: 'HISTORY_READ_FAILED' });
        }
      })
      .finally(() => {
        if (this.loadPromise === operation) this.loadPromise = undefined;
      });
    this.loadPromise = operation;
    return operation;
  }

  private isCurrent(generation: number): boolean {
    return this.active && !this.disposed && this.generation === generation;
  }

  private publish(projection: HistoryControllerProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot alter committed History truth.
      }
    });
  }
}
