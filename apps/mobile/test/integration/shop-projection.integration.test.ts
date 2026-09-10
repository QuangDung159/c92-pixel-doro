import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LoadShopProjectionUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';

import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const cleanup: (() => Promise<unknown>)[] = [];

afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
  ...item,
  catalogVersion: INITIAL_SCHEMA_VERSION,
}));

const createLoader = (database: Awaited<ReturnType<typeof openDatabase>>) =>
  new LoadShopProjectionUseCase({
    approvedCatalog,
    catalog: database.graph.catalog,
    economy: database.graph.economyConsistency,
    ownedItems: database.graph.ownedItems,
  });

const fingerprint = (database: Awaited<ReturnType<typeof openDatabase>>) =>
  database.owner.withConnection((connection) => connection.getFirstAsync<{
    readonly coin_balance: number;
    readonly owned_count: number;
    readonly purchase_count: number;
    readonly reward_count: number;
    readonly session_count: number;
    readonly total_xp: number;
  }>(
    `SELECT total_xp, coin_balance,
      (SELECT COUNT(*) FROM sessions) AS session_count,
      (SELECT COUNT(*) FROM reward_transactions) AS reward_count,
      (SELECT COUNT(*) FROM purchase_transactions) AS purchase_count,
      (SELECT COUNT(*) FROM owned_items) AS owned_count
    FROM pet_profiles WHERE id = 1`,
    [],
  ));

describe('US-08-01 SQLite Shop projection', () => {
  it('loads the exact migration-owned catalog without writing durable state', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0801-fresh-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const database = await openDatabase(new HostDriver(directory), 'shop.db');
    cleanup.push(() => database.owner.close());
    const before = await fingerprint(database);

    await expect(createLoader(database).execute()).resolves.toMatchObject({
      ok: true,
      value: {
        profile: { level: 1, totalXp: 0, coinBalance: 0, xpToNextLevel: 50 },
        items: approvedCatalog.map((item) => ({
          id: item.id,
          displayName: item.displayName,
          priceCoins: item.priceCoins,
          state: 'available',
        })),
      },
    });
    expect(await fingerprint(database)).toEqual(before);
  });

  it('reopens earned progression and mixed ownership from committed SQLite truth', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0801-reopen-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    let database = await openDatabase(driver, 'shop.db');
    let time = now;
    let sequence = 0;
    const coordinator = new SessionCommandCoordinator();
    const shared = {
      clock: { nowMs: () => time },
      coordinator,
      id: { nextId: () => `us0801-integration-${++sequence}` },
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    };
    for (let completed = 0; completed < 3; completed += 1) {
      const started = await new StartStandardFocusUseCase({
        ...shared,
        calendar: { snapshot: () => ({
          ok: true as const,
          value: { localDate: '2026-09-10', utcOffsetMinutes: 420 },
        }) },
      }).execute({ durationMinutes: 25, mode: 'relax', workTag: 'coding' });
      expect(started).toMatchObject({ ok: true });
      if (!started.ok) throw new Error('focus start failed');
      time = started.value.session.endsAt;
      await expect(new ReconcileStandardFocusUseCase(shared).execute(
        started.value.session.id,
      )).resolves.toMatchObject({ ok: true, value: { outcome: 'completed' } });
      time += 1_000;
    }
    await expect(database.transaction.execute(async (scope) => {
      for (const [index, item] of [
        { id: 'desk-mug', price: 5, equipped: false },
        { id: 'tiny-plant', price: 10, equipped: true },
      ].entries()) {
        const transactionId = `us0801-purchase-${item.id}`;
        const timestamp = time + index;
        const debit = await database.graph.profile.debitCatalogItemInTransaction(scope, {
          profileId: 1,
          itemId: item.id,
          updatedAt: timestamp,
        });
        if (!debit.ok) return debit;
        if (debit.value !== 'updated') throw new Error('catalog debit failed');
        const receipt = await database.graph.purchases.insertInTransaction(scope, {
          id: transactionId,
          profileId: 1,
          itemId: item.id,
          pricePaidCoins: item.price,
          coinDelta: -item.price,
          reason: 'item_purchase',
          createdAt: timestamp,
        });
        if (!receipt.ok) return receipt;
        const owned = await database.graph.ownedItems.insertInTransaction(scope, {
          profileId: 1,
          itemId: item.id,
          purchaseTransactionId: transactionId,
          unlockedAt: timestamp,
          isEquipped: item.equipped,
          equippedAt: item.equipped ? timestamp : null,
          updatedAt: timestamp,
        });
        if (!owned.ok) return owned;
      }
      return { ok: true as const, value: undefined };
    })).resolves.toMatchObject({ ok: true });

    const beforeRead = await fingerprint(database);
    const loaded = await createLoader(database).execute();
    expect(loaded).toMatchObject({
      ok: true,
      value: {
        profile: { level: 2, totalXp: 75, coinBalance: 0, xpToNextLevel: 50 },
      },
    });
    if (!loaded.ok) throw new Error('shop load failed');
    expect(loaded.value.items).toHaveLength(12);
    expect(loaded.value.items.find(({ id }) => id === 'desk-mug')).toMatchObject({ state: 'owned' });
    expect(loaded.value.items.find(({ id }) => id === 'tiny-plant')).toMatchObject({ state: 'equipped' });
    expect(await fingerprint(database)).toEqual(beforeRead);

    await database.owner.close();
    database = await openDatabase(driver, 'shop.db');
    cleanup.push(() => database.owner.close());
    const reopened = await createLoader(database).execute();
    expect(reopened).toMatchObject({
      ok: true,
      value: { profile: { totalXp: 75, coinBalance: 0 } },
    });
    if (!reopened.ok) throw new Error('reopened shop load failed');
    expect(reopened.value.items).toHaveLength(12);
    expect(reopened.value.items.find(({ id }) => id === 'desk-mug')).toMatchObject({ state: 'owned' });
    expect(reopened.value.items.find(({ id }) => id === 'tiny-plant')).toMatchObject({ state: 'equipped' });
    expect(await fingerprint(database)).toEqual(beforeRead);
  });

  it('rejects catalog drift instead of presenting a fallback catalog', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0801-corrupt-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const database = await openDatabase(new HostDriver(directory), 'shop.db');
    cleanup.push(() => database.owner.close());
    await database.owner.withConnection((connection) => connection.runAsync(
      'UPDATE catalog_items SET display_name = ? WHERE id = ?',
      ['Tên không hợp lệ', 'desk-mug'],
    ));

    await expect(createLoader(database).execute()).resolves.toEqual({
      ok: false,
      error: { kind: 'load_shop_projection_error', code: 'SHOP_CATALOG_INVALID' },
    });
  });
});
