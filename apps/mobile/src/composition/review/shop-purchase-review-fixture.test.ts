import { describe, expect, it, vi } from 'vitest';

import {
  createShopPurchaseReviewFixture,
  resolveShopPurchaseReviewScenario,
  shopPurchaseReviewDatabaseName,
} from './shop-purchase-review-fixture';

describe('shop purchase review fixture', () => {
  it('allows only implemented dev cases and isolates their database names', () => {
    expect(resolveShopPurchaseReviewScenario('purchase_exact_balance', true))
      .toBe('purchase_exact_balance');
    expect(resolveShopPurchaseReviewScenario('purchase_double_tap', true)).toBeUndefined();
    expect(resolveShopPurchaseReviewScenario('purchase_exact_balance', false)).toBeUndefined();
    expect(shopPurchaseReviewDatabaseName('purchase_exact_balance'))
      .toBe('pixeldoro-us-08-02-purchase_exact_balance.db');
  });

  it('fails only the post-purchase projection read in the one-shot case', async () => {
    const list = vi.fn(async () => ({ ok: true as const, value: [] }));
    const fixture = createShopPurchaseReviewFixture(
      'purchase_read_failure_once',
      { list } as never,
    );
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [] });
    await expect(fixture?.catalog.list()).resolves.toMatchObject({ ok: false });
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [] });
    expect(list).toHaveBeenCalledTimes(2);
  });
});
