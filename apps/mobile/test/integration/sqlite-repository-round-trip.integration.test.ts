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
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

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
      properties: { mode: 'strict', durationMinutes: 25 }, occurredAt: resolvedAt + 2,
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
