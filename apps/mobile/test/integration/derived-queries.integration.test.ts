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
  AnalyticsEventRecord,
} from '@/application';
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

const BASE_TIMESTAMP = 1_787_836_800_000;
const DAY_MS = 86_400_000;
const TTL_MS = 604_800_000;
const REVIEW_NOW = BASE_TIMESTAMP + 400 * DAY_MS;
const temporaryDirectories: string[] = [];

const positionalParameters = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) throw new Error('host_driver_requires_positional_parameters');
  return parameters.map((value) => typeof value === 'boolean' ? (value ? 1 : 0) : value) as SQLInputValue[];
};

const bindRun = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...positionalParameters(parameters));

const bindGet = <TRow>(statement: StatementSync, parameters: SQLiteParameters): TRow | undefined =>
  statement.get(...positionalParameters(parameters)) as TRow | undefined;

const bindAll = <TRow>(statement: StatementSync, parameters: SQLiteParameters): TRow[] =>
  statement.all(...positionalParameters(parameters)) as TRow[];

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
    clock: { nowMs: () => BASE_TIMESTAMP },
    id: { nextId: () => 'derived-query-anonymous-id' },
  });
  expect(await migration.migrate()).toMatchObject({
    ok: true,
    value: { toVersion: 1 },
  });
  return {
    owner,
    transaction,
    graph: createSQLitePersistenceGraph(owner, transaction),
  };
};

interface SessionFixture {
  readonly id: string;
  readonly sessionType: 'focus' | 'short_break' | 'long_break';
  readonly focusVariant: 'standard' | 'onboarding_trial' | null;
  readonly mode: 'relax' | 'strict' | null;
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled';
  readonly workTag: 'coding' | 'study' | 'writing' | 'reading' | null;
  readonly durationMinutes: number;
  readonly startedAt: number;
  readonly resolvedAt: number | null;
  readonly localDate: string;
  readonly utcOffsetMinutes?: number;
}

const insertSession = async (
  owner: SQLiteDatabaseOwner,
  fixture: SessionFixture,
): Promise<void> => {
  const completedFocus = fixture.status === 'completed' && fixture.sessionType === 'focus';
  await owner.withConnection(async (connection) => {
    await connection.runAsync(
      `INSERT INTO sessions (
        id, profile_id, session_type, focus_variant, mode, status, work_tag,
        configured_duration_minutes, started_at, ends_at, backgrounded_at, resolved_at,
        xp_earned, coins_earned, reward_claimed_at, scheduled_end_local_date,
        scheduled_end_utc_offset_minutes, created_at, updated_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fixture.id,
        fixture.sessionType,
        fixture.focusVariant,
        fixture.mode,
        fixture.status,
        fixture.workTag,
        fixture.durationMinutes,
        fixture.startedAt,
        fixture.startedAt + fixture.durationMinutes * 60_000,
        fixture.resolvedAt,
        completedFocus ? fixture.durationMinutes : 0,
        completedFocus ? fixture.durationMinutes / 5 : 0,
        completedFocus ? fixture.resolvedAt : null,
        fixture.localDate,
        fixture.utcOffsetMinutes ?? 420,
        fixture.startedAt,
        fixture.resolvedAt ?? fixture.startedAt,
      ],
    );
  });
};

const insertReviewAttempt = async (
  owner: SQLiteDatabaseOwner,
  id: string,
  appVersion: string,
  attemptedAt: number,
): Promise<void> => {
  await owner.withConnection(async (connection) => {
    await connection.runAsync(
      `INSERT INTO store_review_attempts (id, app_version, attempted_at, created_at)
        VALUES (?, ?, ?, ?)`,
      [id, appVersion, attemptedAt, attemptedAt],
    );
  });
};

const eventRecord = (
  eventId: string,
  occurredAt: number,
  properties: AnalyticsEventRecord['properties'] = {},
): AnalyticsEventRecord => ({
  eventId,
  eventName: 'history_viewed',
  properties,
  occurredAt,
  expiresAt: occurredAt + TTL_MS,
  deliveryState: 'pending',
  attemptCount: 0,
  nextAttemptAt: null,
  createdAt: occurredAt,
});

const insertRawEvent = async (
  owner: SQLiteDatabaseOwner,
  event: AnalyticsEventRecord,
): Promise<void> => {
  await owner.withConnection(async (connection) => {
    await connection.runAsync(
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event.eventId, event.eventName, JSON.stringify(event.properties), event.occurredAt,
        event.expiresAt, event.deliveryState, event.attemptCount,
        event.nextAttemptAt, event.createdAt],
    );
  });
};

const scalarCount = async (
  owner: SQLiteDatabaseOwner,
  table:
    | 'analytics_events'
    | 'sessions'
    | 'reward_transactions'
    | 'purchase_transactions'
    | 'owned_items'
    | 'store_review_attempts'
    | 'pet_profiles'
    | 'catalog_items'
    | 'app_installation'
    | 'app_settings',
): Promise<number> => owner.withConnection(async (connection) => {
  const row = await connection.getFirstAsync<{ readonly count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
    [],
  );
  if (row === null) throw new Error('count_row_missing');
  return row.count;
});

const queryPlan = (
  owner: SQLiteDatabaseOwner,
  sql: string,
  parameters: SQLiteParameters,
): Promise<readonly string[]> => owner.withConnection(async (connection) => {
  const rows = await connection.getAllAsync<{ readonly detail: string }>(
    `EXPLAIN QUERY PLAN ${sql}`,
    parameters,
  );
  return rows.map((row) => row.detail);
});

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('US-02-06 derived durable queries', () => {
  it('derives standard history, persisted-date contribution, cadence and review facts', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0206-queries-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const databaseName = 'derived-queries.db';
    const database = await createDatabase(driver, databaseName);
    const markerStartedAt = BASE_TIMESTAMP + 10 * 60 * 60_000;
    const markerResolvedAt = markerStartedAt + 15 * 60_000;

    const fixtures: readonly SessionFixture[] = [
      {
        id: 'standard-before', sessionType: 'focus', focusVariant: 'standard', mode: 'strict',
        status: 'completed', workTag: 'coding', durationMinutes: 25,
        startedAt: BASE_TIMESTAMP, resolvedAt: BASE_TIMESTAMP + 25 * 60_000,
        localDate: '2026-08-28', utcOffsetMinutes: 420,
      },
      {
        id: 'standard-same-day', sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
        status: 'completed', workTag: 'reading', durationMinutes: 15,
        startedAt: BASE_TIMESTAMP + 60 * 60_000,
        resolvedAt: BASE_TIMESTAMP + 60 * 60_000 + 15 * 60_000,
        localDate: '2026-08-28', utcOffsetMinutes: 420,
      },
      {
        id: 'failed-a', sessionType: 'focus', focusVariant: 'standard', mode: 'strict',
        status: 'failed', workTag: 'study', durationMinutes: 25,
        startedAt: BASE_TIMESTAMP + 2 * 60 * 60_000,
        resolvedAt: BASE_TIMESTAMP + 2 * 60 * 60_000 + 10_000,
        localDate: '2026-08-28',
      },
      {
        id: 'cancelled-b', sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
        status: 'cancelled', workTag: 'writing', durationMinutes: 25,
        startedAt: BASE_TIMESTAMP + 2 * 60 * 60_000,
        resolvedAt: BASE_TIMESTAMP + 2 * 60 * 60_000 + 20_000,
        localDate: '2026-08-28',
      },
      {
        id: 'trial-completed', sessionType: 'focus', focusVariant: 'onboarding_trial', mode: 'relax',
        status: 'completed', workTag: null, durationMinutes: 5,
        startedAt: BASE_TIMESTAMP + 4 * 60 * 60_000,
        resolvedAt: BASE_TIMESTAMP + 4 * 60 * 60_000 + 5 * 60_000,
        localDate: '2026-08-28',
      },
      {
        id: 'short-completed', sessionType: 'short_break', focusVariant: null, mode: null,
        status: 'completed', workTag: null, durationMinutes: 5,
        startedAt: BASE_TIMESTAMP + 5 * 60 * 60_000,
        resolvedAt: BASE_TIMESTAMP + 5 * 60 * 60_000 + 5 * 60_000,
        localDate: '2026-08-28',
      },
      {
        id: 'long-marker', sessionType: 'long_break', focusVariant: null, mode: null,
        status: 'completed', workTag: null, durationMinutes: 15,
        startedAt: markerStartedAt, resolvedAt: markerResolvedAt,
        localDate: '2026-08-28',
      },
      {
        id: 'long-cancelled', sessionType: 'long_break', focusVariant: null, mode: null,
        status: 'cancelled', workTag: null, durationMinutes: 15,
        startedAt: markerResolvedAt + 60_000, resolvedAt: markerResolvedAt + 120_000,
        localDate: '2026-08-28',
      },
      {
        id: 'standard-after', sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
        status: 'completed', workTag: 'reading', durationMinutes: 50,
        startedAt: markerResolvedAt + 3 * 60_000,
        resolvedAt: markerResolvedAt + 53 * 60_000,
        localDate: '2026-08-29', utcOffsetMinutes: -300,
      },
      {
        id: 'standard-running', sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
        status: 'running', workTag: 'coding', durationMinutes: 25,
        startedAt: markerResolvedAt + 4 * 60 * 60_000, resolvedAt: null,
        localDate: '2026-08-29',
      },
    ];
    for (const fixture of fixtures.slice(0, 6)) await insertSession(database.owner, fixture);
    expect(await database.graph.longBreakCadence.getFacts(1)).toEqual({
      ok: true,
      value: {
        profileId: 1,
        completedStandardFocusCountSinceLastCompletedLongBreak: 2,
        latestCompletedLongBreak: null,
      },
    });
    for (const fixture of fixtures.slice(6)) await insertSession(database.owner, fixture);

    await insertReviewAttempt(
      database.owner, 'attempt-boundary', '0.0.1', REVIEW_NOW - 365 * DAY_MS,
    );
    await insertReviewAttempt(
      database.owner, 'attempt-current', '0.2.0', REVIEW_NOW - 100 * DAY_MS,
    );
    await insertReviewAttempt(
      database.owner, 'attempt-future', '0.3.0', REVIEW_NOW + 1,
    );

    const firstHistoryPage = await database.graph.standardFocusHistory.list({
      profileId: 1,
      limit: 2,
      cursor: null,
    });
    expect(firstHistoryPage).toMatchObject({
      ok: true,
      value: {
        entries: [{ id: 'standard-after' }, { id: 'cancelled-b' }],
        nextCursor: { id: 'cancelled-b' },
      },
    });
    if (!firstHistoryPage.ok) throw new Error('history_page_failed');
    const secondHistoryPage = await database.graph.standardFocusHistory.list({
      profileId: 1,
      limit: 10,
      cursor: firstHistoryPage.value.nextCursor,
    });
    expect(secondHistoryPage).toMatchObject({
      ok: true,
      value: {
        entries: [{ id: 'failed-a' }, { id: 'standard-same-day' }, { id: 'standard-before' }],
        nextCursor: null,
      },
    });

    expect(await database.graph.contribution.listRange({
      profileId: 1,
      startLocalDate: '2026-08-28',
      endLocalDate: '2026-08-29',
    })).toEqual({
      ok: true,
      value: [
        {
          scheduledEndLocalDate: '2026-08-28',
          totalCompletedMinutes: 40,
          completedSessionCount: 2,
        },
        {
          scheduledEndLocalDate: '2026-08-29',
          totalCompletedMinutes: 50,
          completedSessionCount: 1,
        },
      ],
    });

    expect(await database.graph.longBreakCadence.getFacts(1)).toEqual({
      ok: true,
      value: {
        profileId: 1,
        completedStandardFocusCountSinceLastCompletedLongBreak: 1,
        latestCompletedLongBreak: {
          sessionId: 'long-marker',
          resolvedAt: markerResolvedAt,
        },
      },
    });

    expect(await database.graph.storeReviewFacts.getFacts({
      profileId: 1,
      appVersion: '0.2.0',
      nowMs: REVIEW_NOW,
    })).toMatchObject({
      ok: true,
      value: {
        installedAt: BASE_TIMESTAMP,
        completedStandardFocusCount: 3,
        distinctStandardFocusActiveDayCount: 2,
        latestAttempt: { id: 'attempt-future', appVersion: '0.3.0' },
        rolling365DayAttemptCount: 2,
        currentVersionAttempted: true,
      },
    });

    expect(await database.graph.standardFocusHistory.list({
      profileId: 1, limit: 0, cursor: null,
    })).toMatchObject({ ok: false, error: { code: 'PERSISTENCE_QUERY_FAILED' } });
    expect(await database.graph.contribution.listRange({
      profileId: 1, startLocalDate: '2026-02-30', endLocalDate: '2026-03-01',
    })).toMatchObject({ ok: false, error: { field: 'contribution_range' } });

    const historyPlan = await queryPlan(
      database.owner,
      `SELECT id FROM sessions WHERE profile_id = ? AND session_type = 'focus'
        AND focus_variant = 'standard' AND status IN ('completed', 'failed', 'cancelled')
        ORDER BY ends_at DESC, id ASC LIMIT ?`,
      [1, 100],
    );
    const contributionPlan = await queryPlan(
      database.owner,
      `SELECT scheduled_end_local_date FROM sessions WHERE profile_id = ?
        AND scheduled_end_local_date BETWEEN ? AND ? AND session_type = 'focus'
        AND focus_variant = 'standard' AND status = 'completed'
        GROUP BY scheduled_end_local_date`,
      [1, '2026-08-28', '2026-08-29'],
    );
    const cadencePlan = await queryPlan(
      database.owner,
      `SELECT id FROM sessions WHERE profile_id = ? AND session_type = 'long_break'
        AND status = 'completed' ORDER BY resolved_at DESC LIMIT 1`,
      [1],
    );
    const reviewPlan = await queryPlan(
      database.owner,
      `SELECT id FROM store_review_attempts WHERE attempted_at BETWEEN ? AND ?
        ORDER BY attempted_at DESC`,
      [REVIEW_NOW - 365 * DAY_MS, REVIEW_NOW],
    );
    expect(historyPlan.join('\n')).toContain('ix_sessions_history');
    expect(contributionPlan.join('\n')).toContain('ix_sessions_local_day');
    expect(cadencePlan.join('\n')).toContain('ix_sessions_long_break_cadence');
    expect(reviewPlan.join('\n')).toContain('ix_store_review_attempt_time');

    await database.owner.close();
    const reopened = await createDatabase(driver, databaseName);
    expect(await reopened.graph.contribution.listRange({
      profileId: 1,
      startLocalDate: '2026-08-29',
      endLocalDate: '2026-08-29',
    })).toMatchObject({
      ok: true,
      value: [{ scheduledEndLocalDate: '2026-08-29', totalCompletedMinutes: 50 }],
    });
    await reopened.owner.close();
  });

  it('verifies exact economy sums in one snapshot and never repairs a mismatch', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0206-economy-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const database = await createDatabase(driver, 'economy.db');

    expect(await database.graph.economyConsistency.verify(1)).toEqual({
      ok: true,
      value: { profileId: 1, totalXp: 0, coinBalance: 0 },
    });

    const session = {
      id: 'economy-focus', profileId: 1, sessionType: 'focus' as const,
      focusVariant: 'standard' as const, mode: 'strict' as const, status: 'running' as const,
      workTag: 'coding' as const, configuredDurationMinutes: 25,
      startedAt: BASE_TIMESTAMP, endsAt: BASE_TIMESTAMP + 25 * 60_000,
      backgroundedAt: null, resolvedAt: null, xpEarned: 0 as const, coinsEarned: 0 as const,
      rewardClaimedAt: null, scheduledEndLocalDate: '2026-08-28',
      scheduledEndUtcOffsetMinutes: 420, createdAt: BASE_TIMESTAMP, updatedAt: BASE_TIMESTAMP,
    };
    const committed = await database.transaction.execute(async (scope) => {
      const inserted = await database.graph.sessions.insertRunningInTransaction(scope, session);
      if (!inserted.ok) return inserted;
      const transitioned = await database.graph.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: session.id, status: 'completed', resolvedAt: session.endsAt,
        xpEarned: 25, coinsEarned: 5, rewardClaimedAt: session.endsAt,
        updatedAt: session.endsAt,
      });
      if (!transitioned.ok) return transitioned;
      const progression = await database.graph.profile.applyProgressionInTransaction(scope, {
        profileId: 1, xpDelta: 25, coinDelta: 5, updatedAt: session.endsAt,
      });
      if (!progression.ok) return progression;
      return database.graph.rewards.insertInTransaction(scope, {
        id: 'economy-reward', sessionId: session.id, profileId: 1,
        xpDelta: 25, coinDelta: 5, reason: 'focus_completed', createdAt: session.endsAt,
      });
    });
    expect(committed.ok).toBe(true);
    expect(await database.graph.economyConsistency.verify(1)).toEqual({
      ok: true,
      value: { profileId: 1, totalXp: 25, coinBalance: 5 },
    });

    await database.owner.withConnection(async (connection) => {
      await connection.runAsync(
        'UPDATE pet_profiles SET total_xp = total_xp + 1 WHERE id = 1',
        [],
      );
    });
    const fingerprint = (): Promise<string> => database.owner.withConnection(async (connection) => {
      const profile = await connection.getAllAsync<unknown>(
        'SELECT id, total_xp, coin_balance, created_at, updated_at FROM pet_profiles ORDER BY id', [],
      );
      const rewards = await connection.getAllAsync<unknown>(
        `SELECT id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
          FROM reward_transactions ORDER BY id`, [],
      );
      const purchases = await connection.getAllAsync<unknown>(
        `SELECT id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
          FROM purchase_transactions ORDER BY id`, [],
      );
      return JSON.stringify({ profile, rewards, purchases });
    });
    const before = await fingerprint();
    expect(await database.graph.economyConsistency.verify(1)).toEqual({
      ok: false,
      error: {
        kind: 'persistence_error',
        code: 'PERSISTENCE_INVARIANT_MISMATCH',
        entity: 'pet_profiles',
        field: 'total_xp',
      },
    });
    expect(await fingerprint()).toBe(before);
    await database.owner.close();
  });

  it('bounds analytics metadata atomically while preserving every product table', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0206-analytics-'));
    temporaryDirectories.push(directory);
    const driver = new HostSQLiteDriver(directory);
    const database = await createDatabase(driver, 'analytics.db');
    expect('insert' in database.graph.analyticsEvents).toBe(false);
    expect('updateDelivery' in database.graph.analyticsEvents).toBe(false);

    for (let index = 0; index < 1_000; index += 1) {
      await insertRawEvent(
        database.owner,
        eventRecord(`queue-${index.toString().padStart(4, '0')}`, REVIEW_NOW - DAY_MS + index),
      );
    }
    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('queue-new', REVIEW_NOW), REVIEW_NOW,
    )).toEqual({ ok: true, value: 'enqueued' });
    expect(await scalarCount(database.owner, 'analytics_events')).toBe(1_000);
    expect(await database.graph.analyticsEvents.findById('queue-0000')).toEqual({
      ok: true, value: null,
    });
    expect(await database.graph.analyticsEvents.findById('queue-new')).toMatchObject({
      ok: true, value: { eventId: 'queue-new' },
    });
    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('queue-new', REVIEW_NOW), REVIEW_NOW,
    )).toEqual({ ok: true, value: 'already_queued' });
    expect(await scalarCount(database.owner, 'analytics_events')).toBe(1_000);

    expect(await database.graph.analyticsQueue.clear()).toEqual({ ok: true, value: 1_000 });
    await insertRawEvent(database.owner, eventRecord('expired-exact', REVIEW_NOW - TTL_MS));
    await insertSession(database.owner, {
      id: 'retained-session', sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
      status: 'cancelled', workTag: 'coding', durationMinutes: 25,
      startedAt: BASE_TIMESTAMP, resolvedAt: BASE_TIMESTAMP + 1,
      localDate: '2026-08-28',
    });
    const retainedRewardResolvedAt = BASE_TIMESTAMP + 60 * 60_000 + 25 * 60_000;
    await insertSession(database.owner, {
      id: 'retained-reward-session', sessionType: 'focus', focusVariant: 'standard', mode: 'strict',
      status: 'completed', workTag: 'study', durationMinutes: 25,
      startedAt: BASE_TIMESTAMP + 60 * 60_000, resolvedAt: retainedRewardResolvedAt,
      localDate: '2026-08-28',
    });
    await database.owner.withConnection(async (connection) => {
      await connection.runAsync(
        `INSERT INTO reward_transactions
          (id, session_id, profile_id, xp_delta, coin_delta, reason, created_at)
          VALUES (?, ?, 1, 25, 5, 'focus_completed', ?)`,
        ['retained-reward', 'retained-reward-session', retainedRewardResolvedAt],
      );
      await connection.runAsync(
        `INSERT INTO purchase_transactions
          (id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at)
          VALUES (?, 1, 'desk-mug', 5, -5, 'item_purchase', ?)`,
        ['retained-purchase', retainedRewardResolvedAt + 1],
      );
      await connection.runAsync(
        `INSERT INTO owned_items
          (profile_id, item_id, purchase_transaction_id, unlocked_at,
            is_equipped, equipped_at, updated_at)
          VALUES (1, 'desk-mug', 'retained-purchase', ?, 0, NULL, ?)`,
        [retainedRewardResolvedAt + 1, retainedRewardResolvedAt + 1],
      );
      await connection.runAsync(
        'UPDATE pet_profiles SET total_xp = 25, coin_balance = 0 WHERE id = 1',
        [],
      );
    });
    await insertReviewAttempt(database.owner, 'retained-review', 'retained-version', BASE_TIMESTAMP);
    const productFingerprint = async (): Promise<string> => JSON.stringify({
      installation: await scalarCount(database.owner, 'app_installation'),
      settings: await scalarCount(database.owner, 'app_settings'),
      profiles: await scalarCount(database.owner, 'pet_profiles'),
      catalog: await scalarCount(database.owner, 'catalog_items'),
      sessions: await scalarCount(database.owner, 'sessions'),
      rewards: await scalarCount(database.owner, 'reward_transactions'),
      purchases: await scalarCount(database.owner, 'purchase_transactions'),
      ownedItems: await scalarCount(database.owner, 'owned_items'),
      reviews: await scalarCount(database.owner, 'store_review_attempts'),
    });
    const productBefore = await productFingerprint();

    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('pending-a', REVIEW_NOW), REVIEW_NOW,
    )).toEqual({ ok: true, value: 'enqueued' });
    expect(await database.graph.analyticsEvents.findById('expired-exact')).toEqual({
      ok: true, value: null,
    });
    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('retry-due', REVIEW_NOW - 2_000), REVIEW_NOW,
    )).toEqual({ ok: true, value: 'enqueued' });
    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('retry-future', REVIEW_NOW - 1_000), REVIEW_NOW,
    )).toEqual({ ok: true, value: 'enqueued' });
    expect(await database.graph.analyticsQueue.markRetry({
      eventId: 'retry-due', deliveryState: 'retry_wait', attemptCount: 1,
      nextAttemptAt: REVIEW_NOW,
    })).toEqual({ ok: true, value: 'updated' });
    expect(await database.graph.analyticsQueue.markRetry({
      eventId: 'retry-future', deliveryState: 'retry_wait', attemptCount: 1,
      nextAttemptAt: REVIEW_NOW + 1,
    })).toEqual({ ok: true, value: 'updated' });
    expect(await database.graph.analyticsQueue.listDue(REVIEW_NOW, 10)).toMatchObject({
      ok: true,
      value: [{ eventId: 'pending-a' }, { eventId: 'retry-due' }],
    });

    const countBeforeRejection = await scalarCount(database.owner, 'analytics_events');
    const unapprovedEvent = {
      ...eventRecord('unapproved-name', REVIEW_NOW),
      eventName: 'database_row_dump',
    } as unknown as AnalyticsEventRecord;
    expect(await database.graph.analyticsQueue.enqueueBounded(
      unapprovedEvent, REVIEW_NOW,
    )).toMatchObject({ ok: false, error: { field: 'event_name' } });
    const freeTextEvent = {
      ...eventRecord('free-text', REVIEW_NOW),
      properties: { comment: 'private task content' },
    } as unknown as AnalyticsEventRecord;
    expect(await database.graph.analyticsQueue.enqueueBounded(
      freeTextEvent, REVIEW_NOW,
    )).toMatchObject({ ok: false, error: { field: 'properties' } });
    expect(await scalarCount(database.owner, 'analytics_events')).toBe(countBeforeRejection);

    await insertRawEvent(database.owner, eventRecord('rollback-expired', REVIEW_NOW - TTL_MS));
    await database.owner.withConnection(async (connection) => {
      await connection.execAsync(`CREATE TRIGGER test_analytics_insert_failure
        BEFORE INSERT ON analytics_events
        WHEN NEW.event_id = 'rollback-new'
        BEGIN SELECT RAISE(ABORT, 'injected_analytics_insert_failure'); END`);
    });
    const beforeRollback = await scalarCount(database.owner, 'analytics_events');
    expect(await database.graph.analyticsQueue.enqueueBounded(
      eventRecord('rollback-new', REVIEW_NOW), REVIEW_NOW,
    )).toMatchObject({ ok: false });
    expect(await scalarCount(database.owner, 'analytics_events')).toBe(beforeRollback);
    expect(await database.graph.analyticsEvents.findById('rollback-expired')).toMatchObject({
      ok: true, value: { eventId: 'rollback-expired' },
    });
    await database.owner.withConnection(async (connection) => {
      await connection.execAsync('DROP TRIGGER test_analytics_insert_failure');
    });

    expect(await productFingerprint()).toBe(productBefore);
    expect(await database.graph.analyticsQueue.deleteDelivered(['pending-a'])).toEqual({
      ok: true, value: 1,
    });

    const expiryPlan = await queryPlan(
      database.owner,
      'SELECT event_id FROM analytics_events WHERE expires_at <= ?',
      [REVIEW_NOW],
    );
    const deliveryPlan = await queryPlan(
      database.owner,
      `SELECT event_id FROM analytics_events
        WHERE delivery_state = 'retry_wait' AND next_attempt_at <= ?
        ORDER BY next_attempt_at, occurred_at`,
      [REVIEW_NOW],
    );
    expect(expiryPlan.join('\n')).toContain('ix_analytics_expiry');
    expect(deliveryPlan.join('\n')).toContain('ix_analytics_delivery');
    await database.owner.close();
  });
});
