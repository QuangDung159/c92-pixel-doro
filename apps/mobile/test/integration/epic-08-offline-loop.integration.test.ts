import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LoadEquippedRoomProjectionUseCase,
  PurchaseItemUseCase,
  SessionCommandCoordinator,
  SetItemEquippedUseCase,
} from '@pixeldoro/application';

import {
  ItemEquippedAnalyticsRecorder,
  ItemUnlockedAnalyticsRecorder,
  ShopAnalyticsRecorder,
} from '@/application';
import {
  createEpic08ExitReviewFixture,
  epic08ExitReviewDatabaseName,
} from '@/composition/review/epic-08-exit-review-fixture';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

import { HostDriver, openDatabase } from '../support/standard-focus-sqlite';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
  ...item,
  catalogVersion: INITIAL_SCHEMA_VERSION,
}));

const fingerprint = (database: Awaited<ReturnType<typeof openDatabase>>) =>
  database.owner.withConnection((connection) => connection.getFirstAsync(
    `SELECT total_xp, coin_balance,
      (SELECT COUNT(*) FROM sessions) AS sessions,
      (SELECT COUNT(*) FROM reward_transactions) AS rewards,
      (SELECT COUNT(*) FROM purchase_transactions) AS purchases,
      (SELECT COUNT(*) FROM owned_items) AS owned,
      (SELECT COUNT(*) FROM analytics_events) AS analytics
    FROM pet_profiles WHERE id = 1`,
    [],
  ));

const fixtureDependencies = (
  database: Awaited<ReturnType<typeof openDatabase>>,
  coordinator = new SessionCommandCoordinator(),
) => ({
  catalog: database.graph.catalog,
  coordinator,
  economy: database.graph.economyConsistency,
  ownedItems: database.graph.ownedItems,
  profile: database.graph.profile,
  purchases: database.graph.purchases,
  rewards: database.graph.rewards,
  sessions: database.graph.sessions,
  transaction: database.transaction,
});

describe('US-08-05 offline loop integrity', () => {
  it('persists reward, purchase, equip and room truth across a cold reopen', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0805-loop-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    const databaseName = epic08ExitReviewDatabaseName('epic_08_relaunch_committed');
    let database = await openDatabase(driver, databaseName);
    const fixture = createEpic08ExitReviewFixture(
      'epic_08_relaunch_committed',
      database.graph.analyticsQueue,
    );
    if (fixture === undefined) throw new Error('fixture missing');

    expect(await fixture.prepare(fixtureDependencies(database))).toBe(true);
    expect(await fixture.prepare(fixtureDependencies(database))).toBe(false);
    const room = new LoadEquippedRoomProjectionUseCase({
      approvedCatalog,
      catalog: database.graph.catalog,
      ownedItems: database.graph.ownedItems,
    });
    await expect(room.execute()).resolves.toMatchObject({
      ok: true,
      value: { items: [{ itemId: 'desk-mug' }] },
    });
    const committed = await fingerprint(database);
    expect(committed).toMatchObject({
      total_xp: 25,
      coin_balance: 0,
      sessions: 1,
      rewards: 1,
      purchases: 1,
      owned: 1,
      analytics: 0,
    });

    await database.owner.close();
    database = await openDatabase(driver, databaseName);
    cleanup.push(() => database.owner.close());
    expect(await fingerprint(database)).toEqual(committed);
    await expect(new LoadEquippedRoomProjectionUseCase({
      approvedCatalog,
      catalog: database.graph.catalog,
      ownedItems: database.graph.ownedItems,
    }).execute()).resolves.toMatchObject({
      ok: true,
      value: { items: [{ itemId: 'desk-mug' }] },
    });
  });

  it('serializes concurrent purchase and equip without duplicate debit or ownership', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0805-race-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const database = await openDatabase(new HostDriver(directory), 'race.db');
    cleanup.push(() => database.owner.close());
    const coordinator = new SessionCommandCoordinator();
    const fixture = createEpic08ExitReviewFixture(
      'epic_08_relaunch_committed',
      database.graph.analyticsQueue,
    );
    if (fixture === undefined) throw new Error('fixture missing');
    await fixture.prepare(fixtureDependencies(database, coordinator));

    const purchase = new PurchaseItemUseCase({
      approvedCatalog,
      catalog: database.graph.catalog,
      clock: { nowMs: () => 1_788_980_000_000 },
      coordinator,
      economy: database.graph.economyConsistency,
      id: { nextId: () => 'must-not-be-inserted' },
      ownedItems: database.graph.ownedItems,
      profile: database.graph.profile,
      purchases: database.graph.purchases,
      transaction: database.transaction,
    });
    const equip = new SetItemEquippedUseCase({
      approvedCatalog,
      catalog: database.graph.catalog,
      clock: { nowMs: () => 1_788_980_000_001 },
      coordinator,
      ownedItems: database.graph.ownedItems,
      purchases: database.graph.purchases,
      transaction: database.transaction,
    });
    const [purchaseAgain, equipAgain] = await Promise.all([
      purchase.execute({ itemId: 'desk-mug' }),
      equip.execute({ itemId: 'desk-mug', isEquipped: true }),
    ]);
    expect(purchaseAgain).toMatchObject({ ok: true, value: { outcome: 'already_owned' } });
    expect(equipAgain).toMatchObject({ ok: true, value: { outcome: 'already_in_state' } });
    expect(await fingerprint(database)).toMatchObject({
      total_xp: 25,
      coin_balance: 0,
      rewards: 1,
      purchases: 1,
      owned: 1,
    });
  });

  it('deduplicates exact analytics and keeps product truth unchanged on queue failure', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0805-analytics-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const database = await openDatabase(new HostDriver(directory), 'analytics.db');
    cleanup.push(() => database.owner.close());
    const fixture = createEpic08ExitReviewFixture(
      'epic_08_relaunch_committed',
      database.graph.analyticsQueue,
    );
    if (fixture === undefined) throw new Error('fixture missing');
    await fixture.prepare(fixtureDependencies(database));
    const receipt = await database.graph.purchases.findByProfileAndItem(1, 'desk-mug');
    const ownership = await database.graph.ownedItems.find(1, 'desk-mug');
    if (!receipt.ok || receipt.value === null || !ownership.ok || ownership.value === null) {
      throw new Error('committed facts missing');
    }
    const enabled = () => true;
    const recorders = [
      new ShopAnalyticsRecorder({ isCaptureEnabled: enabled, queue: database.graph.analyticsQueue }),
      new ItemUnlockedAnalyticsRecorder({ isCaptureEnabled: enabled, queue: database.graph.analyticsQueue }),
      new ItemEquippedAnalyticsRecorder({ isCaptureEnabled: enabled, queue: database.graph.analyticsQueue }),
    ] as const;
    await expect(recorders[0].recordViewed('episode-1', receipt.value.createdAt - 1))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'enqueued' } });
    await expect(recorders[1].recordUnlocked(receipt.value))
      .resolves.toEqual({ ok: true, value: {
        outcome: 'enqueued',
        eventId: 'item_unlocked:us0805-purchase-desk-mug',
      } });
    await expect(recorders[2].recordEquipped(ownership.value))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'enqueued' } });
    await expect(recorders[0].recordViewed('episode-1', receipt.value.createdAt - 1))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'already_queued' } });
    await expect(recorders[1].recordUnlocked(receipt.value))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'already_queued' } });
    await expect(recorders[2].recordEquipped(ownership.value))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'already_queued' } });
    const queued = await database.graph.analyticsQueue.listDue(
      receipt.value.createdAt + 10,
      10,
    );
    expect(queued).toMatchObject({ ok: true });
    if (!queued.ok) throw new Error('analytics read failed');
    expect(queued.value.map(({ eventId, properties }) => ({ eventId, properties })))
      .toEqual([
        { eventId: 'shop_viewed:episode-1', properties: {} },
        { eventId: 'item_unlocked:us0805-purchase-desk-mug', properties: {
          itemId: 'desk-mug', pricePaidCoins: 5,
        } },
        { eventId: `item_equipped:desk-mug:${ownership.value.equippedAt}`, properties: {
          itemId: 'desk-mug',
        } },
      ]);

    const beforeFailure = await fingerprint(database);
    const failure = createEpic08ExitReviewFixture(
      'epic_08_provider_failure',
      database.graph.analyticsQueue,
    );
    if (failure === undefined) throw new Error('failure fixture missing');
    await expect(new ShopAnalyticsRecorder({
      isCaptureEnabled: enabled,
      queue: failure.analyticsQueue,
    }).recordViewed('episode-2', receipt.value.createdAt + 1)).resolves.toMatchObject({
      ok: false,
      error: { code: 'SHOP_ANALYTICS_QUEUE_FAILED' },
    });
    expect(await fingerprint(database)).toEqual(beforeFailure);
  });
});
