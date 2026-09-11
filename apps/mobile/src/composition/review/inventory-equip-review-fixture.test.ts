import { describe, expect, it, vi } from 'vitest';

import {
  createInventoryEquipReviewFixture,
  inventoryEquipReviewDatabaseName,
  resolveInventoryEquipReviewScenario,
} from './inventory-equip-review-fixture';

describe('inventory equip review fixture', () => {
  it('allows only implemented dev cases and isolates database names', () => {
    expect(resolveInventoryEquipReviewScenario('inventory_mixed', true))
      .toBe('inventory_mixed');
    expect(resolveInventoryEquipReviewScenario('equip_double_tap', true)).toBeUndefined();
    expect(resolveInventoryEquipReviewScenario('inventory_mixed', false)).toBeUndefined();
    expect(inventoryEquipReviewDatabaseName('inventory_mixed'))
      .toBe('pixeldoro-us-08-03-inventory_mixed.db');
  });

  it('fails only the post-equip projection read in the one-shot case', async () => {
    const list = vi.fn(async () => ({ ok: true as const, value: [] }));
    const fixture = createInventoryEquipReviewFixture(
      'equip_read_failure_once',
      { list } as never,
    );
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [] });
    await expect(fixture?.catalog.list()).resolves.toMatchObject({ ok: false });
    await expect(fixture?.catalog.list()).resolves.toEqual({ ok: true, value: [] });
    expect(list).toHaveBeenCalledTimes(2);
  });
});
