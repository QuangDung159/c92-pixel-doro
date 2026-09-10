import { describe, expect, it, vi } from 'vitest';

import type { CatalogItemRecord } from '../persistence/catalog.repository';
import { persistenceError } from '../persistence/persistence.error';
import {
  LoadShopProjectionUseCase,
  type ApprovedShopCatalogItem,
  type LoadShopProjectionDependencies,
} from './load-shop-projection.use-case';

const approved = [
  { id: 'desk-mug', displayName: 'Cốc trên bàn', category: 'furniture', priceCoins: 5, catalogVersion: 1 },
  { id: 'tiny-plant', displayName: 'Chậu cây nhỏ', category: 'furniture', priceCoins: 10, catalogVersion: 1 },
] as const satisfies readonly ApprovedShopCatalogItem[];

const records = approved.map((item): CatalogItemRecord => ({
  ...item,
  createdAt: 1,
  updatedAt: 1,
}));

const createDependencies = () => ({
  economy: { verify: vi.fn(async () => ({
    ok: true as const,
    value: { profileId: 1, totalXp: 50, coinBalance: 10 },
  })) },
  catalog: { list: vi.fn(async () => ({ ok: true as const, value: records })) },
  ownedItems: { listByProfile: vi.fn(async () => ({
    ok: true as const,
    value: [{
      profileId: 1,
      itemId: 'tiny-plant',
      purchaseTransactionId: 'purchase-1',
      unlockedAt: 2,
      isEquipped: true,
      equippedAt: 3,
      updatedAt: 3,
    }],
  })) },
  approvedCatalog: approved,
});

describe('LoadShopProjectionUseCase', () => {
  it('projects committed progression and exact ordered ownership state', async () => {
    const dependencies = createDependencies();
    const result = await new LoadShopProjectionUseCase(dependencies).execute();

    expect(result).toEqual({
      ok: true,
      value: {
        profile: {
          level: 2,
          totalXp: 50,
          coinBalance: 10,
          levelProgressPercent: 0,
          xpToNextLevel: 75,
        },
        items: [
          { id: 'desk-mug', displayName: 'Cốc trên bàn', category: 'furniture', priceCoins: 5, state: 'available' },
          { id: 'tiny-plant', displayName: 'Chậu cây nhỏ', category: 'furniture', priceCoins: 10, state: 'equipped' },
        ],
      },
    });
    expect(Object.isFrozen(result.ok && result.value)).toBe(true);
    expect(dependencies.economy.verify).toHaveBeenCalledWith(1);
    expect(dependencies.ownedItems.listByProfile).toHaveBeenCalledWith(1);
  });

  it.each([
    ['missing', records.slice(0, 1)],
    ['extra', [...records, { ...records[1]!, id: 'extra' }]],
    ['wrong price', [{ ...records[0]!, priceCoins: 6 }, records[1]!]],
    ['wrong order', [records[1]!, records[0]!]],
    ['duplicate', [records[0]!, records[0]!]],
  ])('rejects %s catalog facts', async (_label, catalog) => {
    const dependencies = createDependencies();
    dependencies.catalog.list.mockResolvedValueOnce({ ok: true, value: catalog });
    await expect(new LoadShopProjectionUseCase(dependencies).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_CATALOG_INVALID' },
    });
  });

  it('rejects duplicate and foreign ownership facts', async () => {
    const dependencies = createDependencies();
    const owned = (await dependencies.ownedItems.listByProfile()).value;
    if (!owned) throw new Error('expected owned fixture');
    dependencies.ownedItems.listByProfile.mockResolvedValueOnce({
      ok: true,
      value: [owned[0]!, { ...owned[0]!, purchaseTransactionId: 'purchase-2' }],
    });
    await expect(new LoadShopProjectionUseCase(dependencies).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_OWNERSHIP_INVALID' },
    });
  });

  it('distinguishes economy mismatch from transient reads', async () => {
    const inconsistent = createDependencies();
    inconsistent.economy.verify.mockResolvedValueOnce({
      ok: false,
      error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', 'pet_profiles', 'coin_balance'),
    } as never);
    await expect(new LoadShopProjectionUseCase(inconsistent).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_ECONOMY_INCONSISTENT' },
    });

    const unavailable = createDependencies();
    unavailable.catalog.list.mockResolvedValueOnce({
      ok: false,
      error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items'),
    } as never);
    await expect(new LoadShopProjectionUseCase(unavailable).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_READ_FAILED' },
    });
  });

  it('fails closed when an approved catalog dependency is invalid', async () => {
    const dependencies = createDependencies();
    const invalid: LoadShopProjectionDependencies = {
      ...dependencies,
      approvedCatalog: [approved[1]!, approved[0]!],
    };
    await expect(new LoadShopProjectionUseCase(invalid).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_CATALOG_INVALID' },
    });
    expect(dependencies.economy.verify).not.toHaveBeenCalled();
  });
});
