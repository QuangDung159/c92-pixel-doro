import type {
  ClockPort,
  IdPort,
  LoadShopProjectionError,
  ShopProjection,
  ApplicationResult,
} from '@pixeldoro/application';

import type { CriticalRecoveryPort, RuntimeRecoveryReasonCode } from '../recovery';
import type { ShopAnalyticsRecorderPort } from './shop-analytics.recorder';

interface ShopProjectionLoader {
  execute(): Promise<ApplicationResult<ShopProjection, LoadShopProjectionError>>;
}

export type ShopControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly shop: ShopProjection;
      readonly refresh: 'idle' | 'refreshing' | 'error';
    }
  | {
      readonly status: 'error';
      readonly code: 'SHOP_READ_FAILED' | 'SHOP_DATA_INVALID';
    };

export interface ShopControllerDependencies {
  readonly analytics: ShopAnalyticsRecorderPort;
  readonly clock: ClockPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly id: IdPort;
  readonly loader: ShopProjectionLoader;
}

const recoveryReason = (
  code: LoadShopProjectionError['code'],
): RuntimeRecoveryReasonCode | null => {
  switch (code) {
    case 'SHOP_READ_FAILED':
      return null;
    case 'SHOP_ECONOMY_INCONSISTENT':
      return 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED';
    case 'SHOP_PROFILE_INVALID':
    case 'SHOP_CATALOG_INVALID':
    case 'SHOP_OWNERSHIP_INVALID':
      return 'DURABLE_DATA_CORRUPT';
  }
};

export class ShopController {
  private projection: ShopControllerProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private active = false;
  private disposed = false;
  private loadPromise: Promise<void> | undefined;

  constructor(private readonly dependencies: ShopControllerDependencies) {}

  getSnapshot = (): ShopControllerProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.active) return this.loadPromise ?? Promise.resolve();
    this.active = true;
    const generation = ++this.generation;
    this.recordViewedBestEffort();
    return this.load(generation);
  };

  deactivate = (): void => {
    if (this.disposed || !this.active) return;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    if (this.projection.status === 'ready' && this.projection.refresh !== 'idle') {
      this.publish({ ...this.projection, refresh: 'idle' });
    }
  };

  retry = (): Promise<void> => {
    if (this.disposed || !this.active) return Promise.resolve();
    return this.loadPromise ?? this.load(this.generation);
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
    const previous = this.projection.status === 'ready' ? this.projection.shop : null;
    this.publish(previous === null
      ? { status: 'loading' }
      : { status: 'ready', shop: previous, refresh: 'refreshing' });
    const operation = this.dependencies.loader.execute()
      .then((result) => {
        if (this.disposed || !this.active || generation !== this.generation) return;
        if (result.ok) {
          this.publish({ status: 'ready', shop: result.value, refresh: 'idle' });
          return;
        }
        const recovery = recoveryReason(result.error.code);
        if (recovery !== null) {
          this.publish({ status: 'error', code: 'SHOP_DATA_INVALID' });
          this.dependencies.criticalRecovery.enterRecovery(recovery);
          return;
        }
        this.publish(previous === null
          ? { status: 'error', code: 'SHOP_READ_FAILED' }
          : { status: 'ready', shop: previous, refresh: 'error' });
      })
      .catch(() => {
        if (this.disposed || !this.active || generation !== this.generation) return;
        this.publish(previous === null
          ? { status: 'error', code: 'SHOP_READ_FAILED' }
          : { status: 'ready', shop: previous, refresh: 'error' });
      })
      .finally(() => {
        if (this.loadPromise === operation) this.loadPromise = undefined;
      });
    this.loadPromise = operation;
    return operation;
  }

  private recordViewedBestEffort(): void {
    try {
      const episodeId = this.dependencies.id.nextId();
      const occurredAt = this.dependencies.clock.nowMs();
      void this.dependencies.analytics.recordViewed(episodeId, occurredAt)
        .catch(() => undefined);
    } catch {
      // Analytics is optional and cannot affect the Shop projection.
    }
  }

  private publish(projection: ShopControllerProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot alter durable or controller truth.
      }
    }
  }
}
