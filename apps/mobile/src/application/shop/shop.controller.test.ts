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
  items: [],
};

const createDependencies = () => ({
  analytics: { recordViewed: vi.fn(async () => ({
    ok: true as const,
    value: { outcome: 'enqueued' as const, eventId: 'shop_viewed:episode-1' },
  })) },
  clock: { nowMs: vi.fn(() => 1_000) },
  criticalRecovery: { enterRecovery: vi.fn() },
  id: { nextId: vi.fn(() => 'episode-1') },
  loader: { execute: vi.fn(async () => ({ ok: true as const, value: shop })) },
});

describe('ShopController', () => {
  it('loads and records once per focus episode, not per retry', async () => {
    const dependencies = createDependencies();
    const controller = new ShopController(dependencies);

    await controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'ready', shop, refresh: 'idle' });
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
    expect(controller.getSnapshot()).toEqual({ status: 'ready', shop, refresh: 'error' });
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

    expect(controller.getSnapshot()).toEqual({ status: 'ready', shop, refresh: 'idle' });
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
  });
});
