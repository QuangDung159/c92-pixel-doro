import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LoadEquippedRoomProjectionUseCase } from '@pixeldoro/application';

import { INITIAL_CATALOG_SEED, INITIAL_SCHEMA_VERSION } from '@/infrastructure/database/migrations/schema-manifest';

import { HostDriver, openDatabase } from '../support/standard-focus-sqlite';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
  ...item,
  catalogVersion: INITIAL_SCHEMA_VERSION,
}));

describe('US-08-04 SQLite room projection', () => {
  it('reconstructs only committed equipped items after reopen without writing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0804-room-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    let database = await openDatabase(driver, 'room.db');

    await expect(database.transaction.execute(async (scope) => {
      for (const [index, itemId] of ['desk-mug', 'tiny-plant'].entries()) {
        const id = `room-purchase-${itemId}`;
        const timestamp = 1_789_000_000_000 + index;
        const receipt = await database.graph.purchases.insertInTransaction(scope, {
          id, profileId: 1, itemId, pricePaidCoins: index === 0 ? 5 : 10,
          coinDelta: index === 0 ? -5 : -10, reason: 'item_purchase', createdAt: timestamp,
        });
        if (!receipt.ok) return receipt;
        const owned = await database.graph.ownedItems.insertInTransaction(scope, {
          profileId: 1, itemId, purchaseTransactionId: id, unlockedAt: timestamp,
          isEquipped: index === 1, equippedAt: index === 1 ? timestamp : null,
          updatedAt: timestamp,
        });
        if (!owned.ok) return owned;
      }
      return { ok: true as const, value: undefined };
    })).resolves.toMatchObject({ ok: true });

    await database.owner.close();
    database = await openDatabase(driver, 'room.db');
    cleanup.push(() => database.owner.close());
    const before = await database.graph.ownedItems.listByProfile(1);
    const loader = new LoadEquippedRoomProjectionUseCase({
      approvedCatalog,
      catalog: database.graph.catalog,
      ownedItems: database.graph.ownedItems,
    });
    await expect(loader.execute()).resolves.toEqual({
      ok: true,
      value: {
        items: [{
          itemId: 'tiny-plant',
          displayName: 'Chậu cây nhỏ',
          equippedAt: 1_789_000_000_001,
        }],
      },
    });
    expect(await database.graph.ownedItems.listByProfile(1)).toEqual(before);
  });
});
