import { describe, expect, it, vi } from 'vitest';

import type { ShopProjection } from '@pixeldoro/application';
import { ShopController } from './shop.controller';

const shop: ShopProjection = {
  profile: {
    level: 1,
    totalXp: 45,
    coinBalance: 9,
    levelProgressPercent: 90,
    xpToNextLevel: 5,
  },
  items: [{
    id: 'desk-mug', displayName: 'Cốc bàn làm việc', category: 'furniture',
    priceCoins: 5, state: 'available',
  }],
};

const purchasedShop: ShopProjection = {
  ...shop,
  profile: { ...shop.profile, coinBalance: 4 },
  items: [{ ...shop.items[0]!, state: 'owned' }],
};

const receipt = {
  id: 'receipt-1', profileId: 1, itemId: 'desk-mug', pricePaidCoins: 5,
  coinDelta: -5, reason: 'item_purchase' as const, createdAt: 1_000,
};

const createDependencies = () => ({
  analytics: { recordViewed: vi.fn(async () => ({
    ok: true as const,
    value: { outcome: 'enqueued' as const, eventId: 'shop_viewed:episode-1' },
  })) },
  clock: { nowMs: vi.fn(() => 1_000) },
  criticalRecovery: { enterRecovery: vi.fn() },
  id: { nextId: vi.fn(() => 'episode-1') },
  itemUnlockedAnalytics: { recordUnlocked: vi.fn(async () => ({
    ok: true as const,
    value: { outcome: 'enqueued' as const, eventId: 'item_unlocked:receipt-1' },
  })) },
  loader: { execute: vi.fn(async () => ({ ok: true as const, value: shop })) },
  purchaseItem: { execute: vi.fn(async () => ({
    ok: true as const,
    value: {
      outcome: 'fresh_commit' as const,
      receipt,
      ownership: {
        profileId: 1, itemId: 'desk-mug', purchaseTransactionId: 'receipt-1',
        unlockedAt: 1_000, isEquipped: false, equippedAt: null, updatedAt: 1_000,
      },
      coinBalance: 4,
    },
  })) },
});

const idleReady = { status: 'ready', shop, refresh: 'idle', purchase: { status: 'idle' } };

describe('ShopController', () => {
  it('loads and records once per focus episode, not per retry', async () => {
    const dependencies = createDependencies();
    const controller = new ShopController(dependencies);

    await controller.activate();
    expect(controller.getSnapshot()).toEqual(idleReady);
    await controller.activate();
    expect(dependencies.analytics.recordViewed).toHaveBeenCalledTimes(1);
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(1);

    controller.deactivate();
    await controller.activate();
    expect(dependencies.analytics.recordViewed).toHaveBeenCalledTimes(2);
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous committed projection when a refresh fails', async () => {
    const dependencies = createDependencies();
    const controller = new ShopController(dependencies);
    await controller.activate();
    controller.deactivate();
    dependencies.loader.execute.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_READ_FAILED' },
    } as never);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', shop, refresh: 'error', purchase: { status: 'idle' },
    });
    expect(dependencies.criticalRecovery.enterRecovery).not.toHaveBeenCalled();
  });

  it('enters global recovery for durable corruption', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_CATALOG_INVALID' },
    } as never);
    const controller = new ShopController(dependencies);
    await controller.activate();

    expect(controller.getSnapshot()).toEqual({ status: 'error', code: 'SHOP_DATA_INVALID' });
    expect(dependencies.criticalRecovery.enterRecovery).toHaveBeenCalledWith('DURABLE_DATA_CORRUPT');
  });

  it('drops a stale completion after deactivation', async () => {
    let finish: ((result: { ok: true; value: ShopProjection }) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const controller = new ShopController(dependencies);
    const activation = controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    controller.deactivate();
    finish?.({ ok: true, value: shop });
    await activation;
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
  });

  it('coalesces rapid Retry while the current read is pending', async () => {
    let finish: ((result: { ok: true; value: ShopProjection }) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const controller = new ShopController(dependencies);

    const activation = controller.activate();
    const retries = [controller.retry(), controller.retry(), controller.retry()];
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
    expect(dependencies.analytics.recordViewed).toHaveBeenCalledOnce();
    finish?.({ ok: true, value: shop });
    await Promise.all([activation, ...retries]);

    expect(controller.getSnapshot()).toEqual(idleReady);
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
  });

  it('coalesces rapid purchase confirmation and refreshes committed truth', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce({ ok: true, value: shop })
      .mockResolvedValueOnce({ ok: true, value: purchasedShop });
    const controller = new ShopController(dependencies);
    await controller.activate();
    controller.requestPurchase('desk-mug');

    const attempts = [controller.confirmPurchase(), controller.confirmPurchase()];
    await Promise.all(attempts);

    expect(dependencies.purchaseItem.execute).toHaveBeenCalledOnce();
    expect(dependencies.itemUnlockedAnalytics.recordUnlocked).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', shop: purchasedShop, refresh: 'idle',
      purchase: { status: 'success', itemId: 'desk-mug' },
    });
  });

  it('retries only the projection read after a known commit refresh failure', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce({ ok: true, value: shop })
      .mockResolvedValueOnce({
        ok: false,
        error: { kind: 'load_shop_projection_error', code: 'SHOP_READ_FAILED' },
      } as never)
      .mockResolvedValueOnce({ ok: true, value: purchasedShop });
    const controller = new ShopController(dependencies);
    await controller.activate();
    controller.requestPurchase('desk-mug');
    await controller.confirmPurchase();

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', purchase: { status: 'committed_refresh_pending' },
    });
    await controller.retryPurchaseRefresh();
    expect(dependencies.purchaseItem.execute).toHaveBeenCalledOnce();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(3);
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', shop: purchasedShop, purchase: { status: 'success' },
    });
  });

  it('shows the exact committed shortfall without invoking the command', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute.mockResolvedValueOnce({
      ok: true,
      value: { ...shop, profile: { ...shop.profile, coinBalance: 2 } },
    });
    const controller = new ShopController(dependencies);
    await controller.activate();
    controller.requestPurchase('desk-mug');

    expect(controller.getSnapshot()).toMatchObject({
      purchase: { status: 'insufficient', itemId: 'desk-mug', shortfallCoins: 3 },
    });
    expect(dependencies.purchaseItem.execute).not.toHaveBeenCalled();
  });

  it('does not emit item-unlocked for an already-owned command outcome', async () => {
    const dependencies = createDependencies();
    dependencies.purchaseItem.execute.mockResolvedValueOnce({
      ok: true,
      value: {
        outcome: 'already_owned', receipt,
        ownership: {
          profileId: 1, itemId: 'desk-mug', purchaseTransactionId: 'receipt-1',
          unlockedAt: 1_000, isEquipped: false, equippedAt: null, updatedAt: 1_000,
        },
        coinBalance: 4,
      },
    } as never);
    dependencies.loader.execute
      .mockResolvedValueOnce({ ok: true, value: shop })
      .mockResolvedValueOnce({ ok: true, value: purchasedShop });
    const controller = new ShopController(dependencies);
    await controller.activate();
    controller.requestPurchase('desk-mug');
    await controller.confirmPurchase();

    expect(dependencies.itemUnlockedAnalytics.recordUnlocked).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({
      purchase: { status: 'already_owned', itemId: 'desk-mug' },
    });
  });
});
