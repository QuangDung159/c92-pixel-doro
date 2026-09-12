import type {
  ApplicationResult,
  ClockPort,
  FocusHistoryDateSection,
  FocusHistoryItemProjection,
  FocusHistoryPageProjection,
  LoadFocusHistoryPageError,
  LoadFocusHistoryPageInput,
  IdPort,
  StandardFocusHistoryCursor,
} from '@pixeldoro/application';

import type { CriticalRecoveryPort } from '../recovery';
import type { HistoryAnalyticsRecorderPort } from './history-analytics.recorder';
import {
  sameHistoryItem,
  type HistoryControllerProjection,
  type HistoryPaginationState,
  type HistoryRefreshState,
} from './history-projection';

interface HistoryPageLoader {
  execute(input: LoadFocusHistoryPageInput): Promise<
    ApplicationResult<FocusHistoryPageProjection, LoadFocusHistoryPageError>
  >;
}

type HistorySectionResult = ApplicationResult<
  readonly FocusHistoryDateSection[],
  LoadFocusHistoryPageError
>;
type OperationKind = 'initial' | 'refresh' | 'append';

export interface HistoryControllerDependencies {
  readonly analytics: HistoryAnalyticsRecorderPort;
  readonly buildSections: (items: readonly FocusHistoryItemProjection[]) => HistorySectionResult;
  readonly clock: ClockPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly id: IdPort;
  readonly loader: HistoryPageLoader;
}

export class HistoryController {
  private projection: HistoryControllerProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private committedItems: readonly FocusHistoryItemProjection[] | undefined;
  private committedSections: readonly FocusHistoryDateSection[] = Object.freeze([]);
  private nextCursor: StandardFocusHistoryCursor | null = null;
  private active = false;
  private disposed = false;
  private generation = 0;
  private operationKind: OperationKind | undefined;
  private operationPromise: Promise<void> | undefined;

  constructor(private readonly dependencies: HistoryControllerDependencies) {}

  getSnapshot = (): HistoryControllerProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.active) return this.operationPromise ?? Promise.resolve();
    this.active = true;
    this.recordViewedBestEffort();
    return this.committedItems === undefined ? this.startInitial() : this.startRefresh();
  };

  deactivate = (): void => {
    if (this.disposed || !this.active) return;
    this.active = false;
    this.generation += 1;
    this.operationKind = undefined;
    this.operationPromise = undefined;
    if (this.committedItems !== undefined) this.publishCommitted('idle', this.paginationIdle());
  };

  retryInitial = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.committedItems !== undefined ||
      this.projection.status !== 'error'
    ) return Promise.resolve();
    return this.startInitial();
  };

  retry = this.retryInitial;

  refresh = (): Promise<void> => {
    if (this.disposed || !this.active) return Promise.resolve();
    return this.committedItems === undefined ? this.startInitial() : this.startRefresh();
  };

  retryRefresh = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.committedItems === undefined ||
      (this.projection.status !== 'ready' && this.projection.status !== 'empty') ||
      this.projection.refresh !== 'error'
    ) return Promise.resolve();
    return this.startRefresh();
  };

  loadMore = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.committedItems === undefined ||
      this.projection.status !== 'ready' || this.projection.refresh !== 'idle' ||
      this.projection.pagination !== 'idle' || this.nextCursor === null
    ) return this.operationPromise ?? Promise.resolve();
    return this.startAppend(this.nextCursor);
  };

  retryLoadMore = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.projection.status !== 'ready' ||
      this.projection.refresh !== 'idle' || this.projection.pagination !== 'error' ||
      this.nextCursor === null
    ) return Promise.resolve();
    return this.startAppend(this.nextCursor);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.operationKind = undefined;
    this.operationPromise = undefined;
    this.listeners.clear();
  }

  private startInitial(): Promise<void> {
    if (
      this.operationPromise !== undefined &&
      (this.operationKind === 'initial' || this.operationKind === 'refresh')
    ) return this.operationPromise;
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    return this.run('initial', generation, { cursor: null }, (page) => {
      this.commitReplacement(page, generation);
    }, () => {
      if (this.isCurrent(generation)) {
        this.publish({ status: 'error', code: 'HISTORY_READ_FAILED' });
      }
    });
  }

  private startRefresh(): Promise<void> {
    if (
      this.operationPromise !== undefined &&
      (this.operationKind === 'initial' || this.operationKind === 'refresh')
    ) return this.operationPromise;
    const generation = ++this.generation;
    this.publishCommitted('refreshing', this.paginationIdle());
    return this.run('refresh', generation, { cursor: null }, (page) => {
      this.commitReplacement(page, generation);
    }, () => {
      if (this.isCurrent(generation)) this.publishCommitted('error', this.paginationIdle());
    });
  }

  private startAppend(cursor: StandardFocusHistoryCursor): Promise<void> {
    if (this.operationPromise !== undefined) return this.operationPromise;
    const generation = ++this.generation;
    this.publishCommitted('idle', 'loading');
    return this.run('append', generation, { cursor }, (page) => {
      this.commitAppend(page, generation);
    }, () => {
      if (this.isCurrent(generation)) this.publishCommitted('idle', 'error');
    });
  }

  private run(
    kind: OperationKind,
    generation: number,
    input: LoadFocusHistoryPageInput,
    onSuccess: (page: FocusHistoryPageProjection) => void,
    onTechnicalFailure: () => void,
  ): Promise<void> {
    const operation = this.dependencies.loader.execute(input)
      .then((result) => {
        if (!this.isCurrent(generation)) return;
        if (result.ok) {
          onSuccess(result.value);
          return;
        }
        if (result.error.code === 'HISTORY_DATA_INVALID') {
          this.enterInvalidRecovery(generation);
          return;
        }
        onTechnicalFailure();
      })
      .catch(() => {
        if (this.isCurrent(generation)) onTechnicalFailure();
      })
      .finally(() => {
        if (this.operationPromise === operation) {
          this.operationKind = undefined;
          this.operationPromise = undefined;
        }
      });
    this.operationKind = kind;
    this.operationPromise = operation;
    return operation;
  }

  private commitReplacement(page: FocusHistoryPageProjection, generation: number): void {
    if (!this.isCurrent(generation)) return;
    const sections = this.dependencies.buildSections(page.items);
    if (!sections.ok) {
      this.enterInvalidRecovery(generation);
      return;
    }
    this.committedItems = Object.freeze([...page.items]);
    this.committedSections = sections.value;
    this.nextCursor = page.nextCursor;
    this.publishCommitted('idle', this.paginationIdle());
  }

  private commitAppend(page: FocusHistoryPageProjection, generation: number): void {
    if (!this.isCurrent(generation) || this.committedItems === undefined) return;
    const merged = [...this.committedItems];
    const byId = new Map(merged.map((item) => [item.id, item]));
    for (const item of page.items) {
      const existing = byId.get(item.id);
      if (existing !== undefined) {
        if (!sameHistoryItem(existing, item)) {
          this.enterInvalidRecovery(generation);
          return;
        }
        continue;
      }
      merged.push(item);
      byId.set(item.id, item);
    }
    const sections = this.dependencies.buildSections(merged);
    if (!sections.ok) {
      this.enterInvalidRecovery(generation);
      return;
    }
    this.committedItems = Object.freeze(merged);
    this.committedSections = sections.value;
    this.nextCursor = page.nextCursor;
    this.publishCommitted('idle', this.paginationIdle());
  }

  private enterInvalidRecovery(generation: number): void {
    if (!this.isCurrent(generation)) return;
    if (this.committedItems === undefined) {
      this.publish({ status: 'error', code: 'HISTORY_DATA_INVALID' });
    } else {
      this.publishCommitted('idle', this.paginationIdle());
    }
    this.dependencies.criticalRecovery.enterRecovery('DURABLE_DATA_CORRUPT');
  }

  private recordViewedBestEffort(): void {
    try {
      const episodeId = this.dependencies.id.nextId();
      const occurredAt = this.dependencies.clock.nowMs();
      void this.dependencies.analytics.recordViewed(episodeId, occurredAt)
        .catch(() => undefined);
    } catch {
      // Analytics is optional and cannot alter History projection truth.
    }
  }

  private paginationIdle(): HistoryPaginationState {
    return this.nextCursor === null ? 'end' : 'idle';
  }

  private publishCommitted(
    refresh: HistoryRefreshState,
    pagination: HistoryPaginationState,
  ): void {
    if (this.committedItems === undefined) return;
    this.publish(this.committedItems.length === 0
      ? { status: 'empty', refresh }
      : {
          status: 'ready',
          sections: this.committedSections,
          refresh,
          pagination,
        });
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
