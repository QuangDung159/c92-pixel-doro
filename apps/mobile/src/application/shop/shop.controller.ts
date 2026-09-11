import type {
  ApplicationResult,
  ClockPort,
  IdPort,
  LoadShopProjectionError,
  PurchaseItemError,
  PurchaseItemOutcome,
  ShopProjection,
} from '@pixeldoro/application';

import type { CriticalRecoveryPort, RuntimeRecoveryReasonCode } from '../recovery';
import type { ItemUnlockedAnalyticsRecorderPort } from './item-unlocked-analytics.recorder';
import type { ShopAnalyticsRecorderPort } from './shop-analytics.recorder';

interface ShopProjectionLoader {
  execute(): Promise<ApplicationResult<ShopProjection, LoadShopProjectionError>>;
}

interface PurchaseItemCommand {
  execute(input: { readonly itemId: string }): Promise<
    ApplicationResult<PurchaseItemOutcome, PurchaseItemError>
  >;
}

export type ShopPurchaseProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'confirming'; readonly itemId: string }
  | { readonly status: 'submitting'; readonly itemId: string }
  | { readonly status: 'success'; readonly itemId: string }
  | { readonly status: 'committed_refresh_pending'; readonly itemId: string }
  | { readonly status: 'insufficient'; readonly itemId: string; readonly shortfallCoins: number }
  | { readonly status: 'already_owned'; readonly itemId: string }
  | { readonly status: 'error'; readonly itemId: string };

export type ShopControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly shop: ShopProjection;
      readonly refresh: 'idle' | 'refreshing' | 'error';
      readonly purchase: ShopPurchaseProjection;
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
  readonly itemUnlockedAnalytics: ItemUnlockedAnalyticsRecorderPort;
  readonly loader: ShopProjectionLoader;
  readonly purchaseItem: PurchaseItemCommand;
}

const IDLE_PURCHASE: ShopPurchaseProjection = Object.freeze({ status: 'idle' });

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

const purchaseNeedsRecovery = (code: PurchaseItemError['code']): boolean =>
  code === 'PURCHASE_ITEM_UNAVAILABLE' || code === 'PURCHASE_PROFILE_INVALID' ||
  code === 'PURCHASE_DATA_INVALID';

export class ShopController {
  private projection: ShopControllerProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private active = false;
  private disposed = false;
  private loadPromise: Promise<void> | undefined;
  private purchasePromise: Promise<void> | undefined;

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
    if (this.projection.status === 'ready') {
      this.publish({ ...this.projection, refresh: 'idle', purchase: IDLE_PURCHASE });
    }
  };

  retry = (): Promise<void> => {
    if (this.disposed || !this.active) return Promise.resolve();
    return this.loadPromise ?? this.load(this.generation);
  };

  requestPurchase = (itemId: string): void => {
    if (
      this.disposed || !this.active || this.purchasePromise !== undefined ||
      this.projection.status !== 'ready' || this.projection.refresh !== 'idle' ||
      this.projection.purchase.status === 'submitting' ||
      this.projection.purchase.status === 'committed_refresh_pending'
    ) return;
    const item = this.projection.shop.items.find((candidate) => candidate.id === itemId);
    if (item === undefined || item.state !== 'available') return;
    const shortfallCoins = item.priceCoins - this.projection.shop.profile.coinBalance;
    this.publish({
      ...this.projection,
      purchase: shortfallCoins > 0
        ? { status: 'insufficient', itemId, shortfallCoins }
        : { status: 'confirming', itemId },
    });
  };

  dismissPurchase = (): void => {
    if (
      this.projection.status !== 'ready' ||
      this.projection.purchase.status === 'submitting'
    ) return;
    this.publish({ ...this.projection, purchase: IDLE_PURCHASE });
  };

  dismissPurchaseNotice = this.dismissPurchase;

  confirmPurchase = (): Promise<void> => {
    if (this.disposed || !this.active || this.projection.status !== 'ready') {
      return Promise.resolve();
    }
    if (this.purchasePromise !== undefined) return this.purchasePromise;
    if (this.projection.purchase.status !== 'confirming') return Promise.resolve();

    const itemId = this.projection.purchase.itemId;
    const generation = this.generation;
    this.publish({ ...this.projection, purchase: { status: 'submitting', itemId } });
    const operation = this.dependencies.purchaseItem.execute({ itemId })
      .then(async (result) => {
        if (!result.ok) {
          if (this.isCurrent(generation)) this.handlePurchaseError(itemId, result.error);
          return;
        }
        if (result.value.outcome === 'insufficient_funds') {
          if (this.isCurrent(generation)) this.publishReadyPurchase({
            status: 'insufficient',
            itemId,
            shortfallCoins: result.value.shortfallCoins,
          });
          return;
        }
        if (
          result.value.outcome === 'fresh_commit' ||
          result.value.outcome === 'recovery_commit'
        ) this.recordUnlockedBestEffort(result.value.receipt);
        await this.refreshAfterPurchase(
          itemId,
          result.value.outcome === 'already_owned' ? 'already_owned' : 'success',
          generation,
        );
      })
      .catch(() => {
        if (this.isCurrent(generation)) this.publishReadyPurchase({ status: 'error', itemId });
      })
      .finally(() => {
        if (this.purchasePromise === operation) this.purchasePromise = undefined;
      });
    this.purchasePromise = operation;
    return operation;
  };

  retryPurchaseRefresh = (): Promise<void> => {
    if (
      this.disposed || !this.active || this.purchasePromise !== undefined ||
      this.projection.status !== 'ready' ||
      this.projection.purchase.status !== 'committed_refresh_pending'
    ) return Promise.resolve();
    const itemId = this.projection.purchase.itemId;
    const generation = this.generation;
    const operation = this.refreshAfterPurchase(itemId, 'success', generation)
      .finally(() => {
        if (this.purchasePromise === operation) this.purchasePromise = undefined;
      });
    this.purchasePromise = operation;
    return operation;
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    this.purchasePromise = undefined;
    this.listeners.clear();
  }

  private load(generation: number): Promise<void> {
    const previous = this.projection.status === 'ready' ? this.projection.shop : null;
    this.publish(previous === null
      ? { status: 'loading' }
      : { status: 'ready', shop: previous, refresh: 'refreshing', purchase: IDLE_PURCHASE });
    const operation = this.dependencies.loader.execute()
      .then((result) => {
        if (!this.isCurrent(generation)) return;
        if (result.ok) {
          this.publish({
            status: 'ready', shop: result.value, refresh: 'idle', purchase: IDLE_PURCHASE,
          });
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
          : { status: 'ready', shop: previous, refresh: 'error', purchase: IDLE_PURCHASE });
      })
      .catch(() => {
        if (!this.isCurrent(generation)) return;
        this.publish(previous === null
          ? { status: 'error', code: 'SHOP_READ_FAILED' }
          : { status: 'ready', shop: previous, refresh: 'error', purchase: IDLE_PURCHASE });
      })
      .finally(() => {
        if (this.loadPromise === operation) this.loadPromise = undefined;
      });
    this.loadPromise = operation;
    return operation;
  }

  private async refreshAfterPurchase(
    itemId: string,
    finalStatus: 'success' | 'already_owned',
    generation: number,
  ): Promise<void> {
    try {
      const result = await this.dependencies.loader.execute();
      if (!this.isCurrent(generation)) return;
      if (result.ok) {
        this.publish({
          status: 'ready', shop: result.value, refresh: 'idle',
          purchase: { status: finalStatus, itemId },
        });
        return;
      }
      const recovery = recoveryReason(result.error.code);
      if (recovery !== null) {
        this.publish({ status: 'error', code: 'SHOP_DATA_INVALID' });
        this.dependencies.criticalRecovery.enterRecovery(recovery);
        return;
      }
      this.publishReadyPurchase({ status: 'committed_refresh_pending', itemId });
    } catch {
      if (this.isCurrent(generation)) {
        this.publishReadyPurchase({ status: 'committed_refresh_pending', itemId });
      }
    }
  }

  private handlePurchaseError(itemId: string, error: PurchaseItemError): void {
    if (purchaseNeedsRecovery(error.code)) {
      this.publish({ status: 'error', code: 'SHOP_DATA_INVALID' });
      this.dependencies.criticalRecovery.enterRecovery('DURABLE_DATA_CORRUPT');
      return;
    }
    this.publishReadyPurchase({ status: 'error', itemId });
  }

  private publishReadyPurchase(purchase: ShopPurchaseProjection): void {
    if (this.projection.status !== 'ready') return;
    this.publish({ ...this.projection, refresh: 'idle', purchase });
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && this.active && generation === this.generation;
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

  private recordUnlockedBestEffort(
    receipt: Parameters<ItemUnlockedAnalyticsRecorderPort['recordUnlocked']>[0],
  ): void {
    try {
      void this.dependencies.itemUnlockedAnalytics.recordUnlocked(receipt)
        .catch(() => undefined);
    } catch {
      // Analytics is optional and cannot affect purchase truth.
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
