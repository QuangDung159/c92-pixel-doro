import { describe, expect, it, vi } from 'vitest';

import { createShopReviewFixture, resolveShopReviewScenario, shopReviewDatabaseName } from './shop-review-fixture';

describe('shop review fixture', () => {
  it('allows only finite dev scenarios and isolated database names', () => {
    expect(resolveShopReviewScenario('shop_progress_45', true)).toBe('shop_progress_45');
    expect(resolveShopReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveShopReviewScenario('shop_progress_45', false)).toBeUndefined();
    expect(shopReviewDatabaseName('shop_fresh_zero')).toBe(
      'pixeldoro-us-08-01-shop_fresh_zero.db',
    );
  });

  it('injects one read failure then delegates', async () => {
    const list = vi.fn(async () => ({ ok: true as const, value: [] }));
    const fixture = createShopReviewFixture('shop_read_failure_once', { list } as never);
    await expect(fixture?.catalog.list()).resolves.toMatchObject({ ok: false });
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [] });
    expect(list).toHaveBeenCalledOnce();
  });

  it('creates a deterministic corrupt catalog projection without mutating the delegate', async () => {
    const items = [{ id: 'one' }, { id: 'two' }];
    const fixture = createShopReviewFixture('shop_catalog_corrupt', {
      list: vi.fn(async () => ({ ok: true as const, value: items })),
    } as never);
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [items[0]] });
    expect(items).toHaveLength(2);
  });
});
