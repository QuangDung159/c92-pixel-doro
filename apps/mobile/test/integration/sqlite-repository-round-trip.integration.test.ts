import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

import type {
  ApplicationResult,
  PersistenceError,
  RunningSessionRecord,
} from '@pixeldoro/application';
import {
  PurchaseItemUseCase,
  SessionCommandCoordinator,
  SetItemEquippedUseCase,
} from '@pixeldoro/application';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';
import { createInventoryEquipReviewFixture } from '@/composition/review/inventory-equip-review-fixture';

const timestamp = 1_787_836_800_000;
const temporaryDirectories: string[] = [];

const positionalParameters = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) throw new Error('host_driver_requires_positional_parameters');
  return parameters.map((value) => typeof value === 'boolean' ? (value ? 1 : 0) : value) as SQLInputValue[];
};

const bindRun = (
  statement: StatementSync,
  parameters: SQLiteParameters,
) => statement.run(...positionalParameters(parameters));

const bindGet = <TRow>(
  statement: StatementSync,
  parameters: SQLiteParameters,
): TRow | undefined => statement.get(
  ...positionalParameters(parameters),
) as TRow | undefined;

const bindAll = <TRow>(
  statement: StatementSync,
  parameters: SQLiteParameters,
): TRow[] => statement.all(...positionalParameters(parameters)) as TRow[];

class HostSQLiteConnection {
  constructor(private readonly database: DatabaseSync) {}

  closeAsync(): Promise<void> {
    this.database.close();
    return Promise.resolve();
  }

  execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
    return Promise.resolve();
  }

  runAsync(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> {
    const result = bindRun(this.database.prepare(sql), parameters);
    return Promise.resolve({
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    } as SQLiteWriteResult);
  }

  getFirstAsync<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow | null> {
    return Promise.resolve(bindGet<TRow>(this.database.prepare(sql), parameters) ?? null);
  }

  getAllAsync<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow[]> {
    return Promise.resolve(bindAll<TRow>(this.database.prepare(sql), parameters));
  }
}

class HostSQLiteDriver implements SQLiteDriver {
  constructor(private readonly directory: string) {}

  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return Promise.resolve(new HostSQLiteConnection(
      new DatabaseSync(join(this.directory, databaseName)),
    ) as unknown as SQLiteConnection);
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

const createDatabase = async (driver: SQLiteDriver, databaseName: string) => {
  const owner = new SQLiteDatabaseOwner(databaseName, driver);
  expect(await owner.open()).toEqual({ ok: true, value: undefined });
  const transaction = new SQLiteTransaction(owner);
  const migration = new MigrationRunner({
    owner,
    transaction,
    registry: productionMigrationRegistry,
    clock: { nowMs: () => timestamp },
    id: { nextId: () => 'host-repository-anonymous-id' },
  });
  expect(await migration.migrate()).toMatchObject({
    ok: true,
    value: { toVersion: 1 },
  });
  return { owner, transaction, graph: createSQLitePersistenceGraph(owner, transaction) };
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('SQLite repository durable round trip', () => {
  it('seeds the multi-equipped review fixture through production commands', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0803-fixture-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const database = await createDatabase(driver, 'inventory-fixture.db');
    const fixture = createInventoryEquipReviewFixture(
      'inventory_multi_equipped',
      database.graph.catalog,
    );
    expect(await fixture?.prepare({
      catalog: database.graph.catalog,
      coordinator: new SessionCommandCoordinator(),
      economy: database.graph.economyConsistency,
      ownedItems: database.graph.ownedItems,
      profile: database.graph.profile,
      purchases: database.graph.purchases,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    })).toBe(true);

    expect(await database.graph.profile.find()).toMatchObject({
      ok: true, value: { totalXp: 150, coinBalance: 0 },
    });
    expect(await database.graph.ownedItems.find(1, 'desk-mug')).toMatchObject({
      ok: true, value: { isEquipped: true },
    });
    expect(await database.graph.ownedItems.find(1, 'tiny-plant')).toMatchObject({
      ok: true, value: { isEquipped: true },
    });
    expect(await database.graph.ownedItems.find(1, 'book-stack')).toMatchObject({
      ok: true, value: { isEquipped: false },
    });
    expect(await fixture?.prepare({
      catalog: database.graph.catalog,
      coordinator: new SessionCommandCoordinator(),
      economy: database.graph.economyConsistency,
      ownedItems: database.graph.ownedItems,
      profile: database.graph.profile,
      purchases: database.graph.purchases,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    })).toBe(false);
    await database.owner.close();
  });

  it('commits one atomic purchase and reopens the debited unequipped ownership', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0802-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const databaseName = 'purchase.db';
    const first = await createDatabase(driver, databaseName);
    const session: RunningSessionRecord = {
      id: 'purchase-focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
      mode: 'relax', status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
      startedAt: timestamp, endsAt: timestamp + 1_500_000, backgroundedAt: null,
      resolvedAt: null, xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
      scheduledEndLocalDate: '2026-08-28', scheduledEndUtcOffsetMinutes: 420,
      createdAt: timestamp, updatedAt: timestamp,
    };
    const rewarded = await first.transaction.execute(async (scope) => {
      const inserted = await first.graph.sessions.insertRunningInTransaction(scope, session);
      if (!inserted.ok) return inserted;
      const resolvedAt = session.endsAt;
      const transitioned = await first.graph.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: session.id, status: 'completed', resolvedAt, xpEarned: 25,
        coinsEarned: 5, rewardClaimedAt: resolvedAt, updatedAt: resolvedAt,
      });
      if (!transitioned.ok) return transitioned;
      const progressed = await first.graph.profile.applyProgressionInTransaction(scope, {
        profileId: 1, xpDelta: 25, coinDelta: 5, updatedAt: resolvedAt,
      });
      if (!progressed.ok) return progressed;
      return first.graph.rewards.insertInTransaction(scope, {
        id: 'purchase-reward-1', sessionId: session.id, profileId: 1,
        xpDelta: 25, coinDelta: 5, reason: 'focus_completed', createdAt: resolvedAt,
      });
    });
    expect(rewarded).toMatchObject({ ok: true });

    const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
      ...item, catalogVersion: INITIAL_SCHEMA_VERSION,
    }));
    const purchase = new PurchaseItemUseCase({
      approvedCatalog,
      catalog: first.graph.catalog,
      clock: { nowMs: () => session.endsAt + 1 },
      coordinator: new SessionCommandCoordinator(),
      economy: first.graph.economyConsistency,
      id: { nextId: () => 'purchase-receipt-1' },
      ownedItems: first.graph.ownedItems,
      profile: first.graph.profile,
      purchases: first.graph.purchases,
      transaction: first.transaction,
    });
    expect(await purchase.execute({ itemId: 'desk-mug' })).toMatchObject({
      ok: true,
      value: {
        outcome: 'fresh_commit', coinBalance: 0,
        receipt: { id: 'purchase-receipt-1', pricePaidCoins: 5 },
        ownership: { isEquipped: false, equippedAt: null },
      },
    });
    await first.owner.close();

    const reopened = await createDatabase(driver, databaseName);
    expect(await reopened.graph.economyConsistency.verify(1)).toMatchObject({
      ok: true, value: { totalXp: 25, coinBalance: 0 },
    });
    expect(await reopened.graph.purchases.findByProfileAndItem(1, 'desk-mug'))
      .toMatchObject({ ok: true, value: { id: 'purchase-receipt-1', coinDelta: -5 } });
    expect(await reopened.graph.ownedItems.find(1, 'desk-mug'))
      .toMatchObject({ ok: true, value: { isEquipped: false, equippedAt: null } });
    const reopenedPurchase = new PurchaseItemUseCase({
      approvedCatalog,
      catalog: reopened.graph.catalog,
      clock: { nowMs: () => session.endsAt + 2 },
      coordinator: new SessionCommandCoordinator(),
      economy: reopened.graph.economyConsistency,
      id: { nextId: () => 'purchase-receipt-2' },
      ownedItems: reopened.graph.ownedItems,
      profile: reopened.graph.profile,
      purchases: reopened.graph.purchases,
      transaction: reopened.transaction,
    });
    expect(await reopenedPurchase.execute({ itemId: 'desk-mug' })).toMatchObject({
      ok: true, value: { outcome: 'already_owned', coinBalance: 0 },
    });
    const equip = new SetItemEquippedUseCase({
      approvedCatalog,
      catalog: reopened.graph.catalog,
      clock: { nowMs: () => session.endsAt + 3 },
      coordinator: new SessionCommandCoordinator(),
      ownedItems: reopened.graph.ownedItems,
      purchases: reopened.graph.purchases,
      transaction: reopened.transaction,
    });
    expect(await equip.execute({ itemId: 'desk-mug', isEquipped: true })).toMatchObject({
      ok: true,
      value: {
        outcome: 'fresh_commit', transition: 'equipped',
        ownership: { isEquipped: true, equippedAt: session.endsAt + 3 },
      },
    });
    expect(await reopened.graph.economyConsistency.verify(1)).toMatchObject({
      ok: true, value: { totalXp: 25, coinBalance: 0 },
    });
    expect(await reopened.graph.purchases.findByProfileAndItem(1, 'desk-mug'))
      .toMatchObject({ ok: true, value: { id: 'purchase-receipt-1', coinDelta: -5 } });
    await reopened.owner.close();

    const equippedReopen = await createDatabase(driver, databaseName);
    expect(await equippedReopen.graph.ownedItems.find(1, 'desk-mug')).toMatchObject({
      ok: true,
      value: { isEquipped: true, equippedAt: session.endsAt + 3 },
    });
    const unequip = new SetItemEquippedUseCase({
      approvedCatalog,
      catalog: equippedReopen.graph.catalog,
      clock: { nowMs: () => session.endsAt + 4 },
      coordinator: new SessionCommandCoordinator(),
      ownedItems: equippedReopen.graph.ownedItems,
      purchases: equippedReopen.graph.purchases,
      transaction: equippedReopen.transaction,
    });
    expect(await unequip.execute({ itemId: 'desk-mug', isEquipped: false })).toMatchObject({
      ok: true,
      value: {
        outcome: 'fresh_commit', transition: 'unequipped',
        ownership: { isEquipped: false, equippedAt: null, updatedAt: session.endsAt + 4 },
      },
    });
    expect(await equippedReopen.graph.economyConsistency.verify(1)).toMatchObject({
      ok: true, value: { totalXp: 25, coinBalance: 0 },
    });
    await equippedReopen.owner.close();
  });

  it('selects the latest onboarding trial deterministically and excludes Standard Focus', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0501-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const databaseName = 'first-use-entry.db';
    const first = await createDatabase(driver, databaseName);

    const commitTerminalSession = async (
      record: RunningSessionRecord,
      status: 'completed' | 'cancelled',
    ) => first.transaction.execute(async (scope) => {
      const inserted = await first.graph.sessions.insertRunningInTransaction(scope, record);
      if (!inserted.ok) return inserted;
      const resolvedAt = record.endsAt;
      return first.graph.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: record.id,
        status,
        resolvedAt,
        xpEarned: status === 'completed' ? record.configuredDurationMinutes : 0,
        coinsEarned: status === 'completed'
          ? Math.floor(record.configuredDurationMinutes / 5)
          : 0,
        rewardClaimedAt: status === 'completed' ? resolvedAt : null,
        updatedAt: resolvedAt,
      });
    });

    const baseTrial: RunningSessionRecord = {
      id: 'trial-a', profileId: 1, sessionType: 'focus', focusVariant: 'onboarding_trial',
      mode: 'relax', status: 'running', workTag: null, configuredDurationMinutes: 5,
      startedAt: timestamp, endsAt: timestamp + 300_000, backgroundedAt: null,
      resolvedAt: null, xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
      scheduledEndLocalDate: '2026-08-28', scheduledEndUtcOffsetMinutes: 420,
      createdAt: timestamp, updatedAt: timestamp,
    };
    expect(await commitTerminalSession(baseTrial, 'cancelled')).toMatchObject({ ok: true });
    expect(await commitTerminalSession({ ...baseTrial, id: 'trial-b' }, 'cancelled'))
      .toMatchObject({ ok: true });
    expect(await commitTerminalSession({
      ...baseTrial,
      id: 'newer-standard',
      focusVariant: 'standard',
      mode: 'relax',
      workTag: 'coding',
      configuredDurationMinutes: 25,
      startedAt: timestamp + 1,
      endsAt: timestamp + 1 + 1_500_000,
      createdAt: timestamp + 1,
      updatedAt: timestamp + 1,
    }, 'completed')).toMatchObject({ ok: true });

    expect(await first.graph.sessions.findLatestOnboardingTrial()).toMatchObject({
      ok: true,
      value: { id: 'trial-b', focusVariant: 'onboarding_trial', status: 'cancelled' },
    });
    await first.owner.close();

    const reopened = await createDatabase(driver, databaseName);
    expect(await reopened.graph.sessions.findLatestOnboardingTrial()).toMatchObject({
      ok: true,
      value: { id: 'trial-b', status: 'cancelled' },
    });
    await reopened.owner.close();
  });

  it('commits cross-entity values, reopens them exactly and rolls failures back', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0205-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const databaseName = 'repositories.db';
    const first = await createDatabase(driver, databaseName);
    const session: RunningSessionRecord = {
      id: 'host-session-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
      mode: 'strict', status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
      startedAt: timestamp, endsAt: timestamp + 25 * 60_000, backgroundedAt: null,
      resolvedAt: null, xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
      scheduledEndLocalDate: '2026-08-28', scheduledEndUtcOffsetMinutes: 420,
      createdAt: timestamp, updatedAt: timestamp,
    };
    const resolvedAt = session.endsAt;

    const rewardCommit = await first.transaction.execute(async (scope) => {
      const inserted = await first.graph.sessions.insertRunningInTransaction(scope, session);
      if (!inserted.ok) return inserted;
      const transitioned = await first.graph.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: session.id, status: 'completed', resolvedAt, xpEarned: 25,
        coinsEarned: 5, rewardClaimedAt: resolvedAt, updatedAt: resolvedAt,
      });
      if (!transitioned.ok) return transitioned;
      const progression = await first.graph.profile.applyProgressionInTransaction(scope, {
        profileId: 1, xpDelta: 25, coinDelta: 5, updatedAt: resolvedAt,
      });
      if (!progression.ok) return progression;
      return first.graph.rewards.insertInTransaction(scope, {
        id: 'host-reward-1', sessionId: session.id, profileId: 1,
        xpDelta: 25, coinDelta: 5, reason: 'focus_completed', createdAt: resolvedAt,
      });
    });
    expect(rewardCommit.ok).toBe(true);

    const purchaseCommit = await first.transaction.execute(async (scope) => {
      const debited = await first.graph.profile.debitCatalogItemInTransaction(scope, {
        profileId: 1, itemId: 'desk-mug', updatedAt: resolvedAt + 1,
      });
      if (!debited.ok) return debited;
      const purchase = await first.graph.purchases.insertInTransaction(scope, {
        id: 'host-purchase-1', profileId: 1, itemId: 'desk-mug', pricePaidCoins: 5,
        coinDelta: -5, reason: 'item_purchase', createdAt: resolvedAt + 1,
      });
      if (!purchase.ok) return purchase;
      return first.graph.ownedItems.insertInTransaction(scope, {
        profileId: 1, itemId: 'desk-mug', purchaseTransactionId: 'host-purchase-1',
        unlockedAt: resolvedAt + 1, isEquipped: true, equippedAt: resolvedAt + 1,
        updatedAt: resolvedAt + 1,
      });
    });
    expect(purchaseCommit.ok).toBe(true);
    expect(await first.graph.storeReviewAttempts.insert({
      id: 'host-review-1', appVersion: '0.1.0', attemptedAt: resolvedAt + 2,
      createdAt: resolvedAt + 2,
    })).toMatchObject({ ok: true });
    expect(await first.graph.analyticsQueue.enqueueBounded({
      eventId: 'host-event-1', eventName: 'focus_session_completed',
      properties: {
        mode: 'strict', workTag: 'coding', durationMinutes: 25,
        terminalStatus: 'completed',
      },
      occurredAt: resolvedAt + 2,
      expiresAt: resolvedAt + 2 + 604_800_000, deliveryState: 'pending', attemptCount: 0,
      nextAttemptAt: null, createdAt: resolvedAt + 2,
    }, resolvedAt + 2)).toMatchObject({ ok: true });
    await first.owner.close();

    const reopened = await createDatabase(driver, databaseName);
    expect(await reopened.graph.sessions.findById(session.id)).toMatchObject({
      ok: true, value: { status: 'completed', xpEarned: 25 },
    });
    expect(await reopened.graph.rewards.findBySessionId(session.id)).toMatchObject({
      ok: true, value: { id: 'host-reward-1', coinDelta: 5 },
    });
    expect(await reopened.graph.profile.find()).toMatchObject({
      ok: true, value: { totalXp: 25, coinBalance: 0 },
    });
    expect(await reopened.graph.purchases.findById('host-purchase-1')).toMatchObject({
      ok: true, value: { pricePaidCoins: 5 },
    });
    expect(await reopened.graph.ownedItems.find(1, 'desk-mug')).toMatchObject({
      ok: true, value: { isEquipped: true, equippedAt: resolvedAt + 1 },
    });
    expect(await reopened.graph.storeReviewAttempts.findByAppVersion('0.1.0')).toMatchObject({
      ok: true, value: { id: 'host-review-1' },
    });
    expect(await reopened.graph.analyticsEvents.findById('host-event-1')).toMatchObject({
      ok: true, value: { properties: { durationMinutes: 25 } },
    });

    const rollback = await reopened.transaction.execute<
      void,
      PersistenceError | { readonly code: 'INJECTED' }
    >(async (scope): Promise<ApplicationResult<
      void,
      PersistenceError | { readonly code: 'INJECTED' }
    >> => {
      const progression = await reopened.graph.profile.applyProgressionInTransaction(scope, {
        profileId: 1, xpDelta: 1, coinDelta: 1, updatedAt: resolvedAt + 3,
      });
      if (!progression.ok) return { ok: false, error: progression.error };
      return { ok: false as const, error: { code: 'INJECTED' as const } };
    });
    expect(rollback).toEqual({ ok: false, error: { code: 'INJECTED' } });
    expect(await reopened.graph.profile.find()).toMatchObject({
      ok: true, value: { totalXp: 25, coinBalance: 0 },
    });
    await reopened.owner.close();
  });
});
