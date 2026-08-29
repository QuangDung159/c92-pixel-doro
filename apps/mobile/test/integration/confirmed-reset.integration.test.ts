import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ConfirmedResetDiagnostic,
  ResetNotificationCleanupPort,
} from '@/application';
import { createMobileApplication } from '@/composition/create-mobile-application';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { INITIAL_SCHEMA_TABLES } from '@/infrastructure/database/migrations/schema-manifest';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

const ORIGINAL_TIME = 1_787_836_800_000;
const RESET_TIME = ORIGINAL_TIME + 86_400_000;
const temporaryDirectories: string[] = [];

const positionalParameters = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) throw new Error('positional_parameters_required');
  return parameters.map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value,
  ) as SQLInputValue[];
};

const bindRun = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...positionalParameters(parameters));

class ResetHostConnection {
  constructor(
    private readonly database: DatabaseSync,
    private readonly driver: ResetHostDriver,
  ) {}

  closeAsync(): Promise<void> {
    this.database.close();
    return Promise.resolve();
  }

  execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
    return Promise.resolve();
  }

  runAsync(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> {
    if (
      this.driver.failRunContaining !== null &&
      sql.includes(this.driver.failRunContaining)
    ) {
      this.driver.failRunContaining = null;
      return Promise.reject(new Error('raw injected reset failure'));
    }
    const result = bindRun(this.database.prepare(sql), parameters);
    return Promise.resolve({
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    } as SQLiteWriteResult);
  }

  getFirstAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    return Promise.resolve(
      (this.database.prepare(sql).get(...positionalParameters(parameters)) as
        | TRow
        | undefined) ?? null,
    );
  }

  getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    return Promise.resolve(
      this.database.prepare(sql).all(...positionalParameters(parameters)) as TRow[],
    );
  }
}

class ResetHostDriver implements SQLiteDriver {
  failRunContaining: string | null = null;

  constructor(private readonly directory: string) {}

  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return Promise.resolve(
      new ResetHostConnection(
        new DatabaseSync(join(this.directory, databaseName)),
        this,
      ) as unknown as SQLiteConnection,
    );
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

const prepareProductFixture = async (
  driver: SQLiteDriver,
  databaseName: string,
): Promise<void> => {
  const owner = new SQLiteDatabaseOwner(databaseName, driver);
  expect(await owner.open()).toEqual({ ok: true, value: undefined });
  const transaction = new SQLiteTransaction(owner);
  const migration = new MigrationRunner({
    owner,
    transaction,
    registry: productionMigrationRegistry,
    clock: { nowMs: () => ORIGINAL_TIME },
    id: { nextId: () => 'old-anonymous-id' },
  });
  expect(await migration.migrate()).toMatchObject({ ok: true });

  await owner.withConnection(async (connection) => {
    await connection.runAsync(
      `UPDATE app_installation SET onboarding_completed_at = ?, updated_at = ? WHERE id = 1`,
      [ORIGINAL_TIME + 1, ORIGINAL_TIME + 1],
    );
    await connection.runAsync(
      `UPDATE app_settings SET focus_duration_minutes = 50, default_mode = 'strict',
       sound_enabled = 0, haptics_enabled = 0, notifications_enabled = 0,
       analytics_enabled = 0, updated_at = ? WHERE id = 1`,
      [ORIGINAL_TIME + 1],
    );
    await connection.runAsync(
      `UPDATE pet_profiles SET total_xp = 25, coin_balance = 0, updated_at = ? WHERE id = 1`,
      [ORIGINAL_TIME + 1],
    );
    await connection.runAsync(
      `INSERT INTO sessions (
        id, profile_id, session_type, focus_variant, mode, status, work_tag,
        configured_duration_minutes, started_at, ends_at, backgrounded_at,
        resolved_at, xp_earned, coins_earned, reward_claimed_at,
        scheduled_end_local_date, scheduled_end_utc_offset_minutes,
        created_at, updated_at
      ) VALUES (?, 1, 'focus', 'standard', 'relax', 'completed', 'coding',
        25, ?, ?, NULL, ?, 25, 5, ?, '2026-08-28', 420, ?, ?)`,
      [
        'reset-session',
        ORIGINAL_TIME,
        ORIGINAL_TIME + 1_500_000,
        ORIGINAL_TIME + 1_500_000,
        ORIGINAL_TIME + 1_500_000,
        ORIGINAL_TIME,
        ORIGINAL_TIME + 1_500_000,
      ],
    );
    await connection.runAsync(
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, 1, 25, 5, 'focus_completed', ?)`,
      ['reset-reward', 'reset-session', ORIGINAL_TIME + 1_500_000],
    );
    await connection.runAsync(
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, 1, 'desk-mug', 5, -5, 'item_purchase', ?)`,
      ['reset-purchase', ORIGINAL_TIME + 1_600_000],
    );
    await connection.runAsync(
      `INSERT INTO owned_items (
        profile_id, item_id, purchase_transaction_id, unlocked_at,
        is_equipped, equipped_at, updated_at
      ) VALUES (1, 'desk-mug', ?, ?, 0, NULL, ?)`,
      ['reset-purchase', ORIGINAL_TIME + 1_600_000, ORIGINAL_TIME + 1_600_000],
    );
    await connection.runAsync(
      `INSERT INTO store_review_attempts (
        id, app_version, attempted_at, created_at
      ) VALUES (?, '0.1.0', ?, ?)`,
      ['reset-review', ORIGINAL_TIME + 1_700_000, ORIGINAL_TIME + 1_700_000],
    );
    await connection.runAsync(
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, 'focus_session_started', '{}', ?, ?, 'pending', 0, NULL, ?)`,
      [
        'reset-event',
        ORIGINAL_TIME,
        ORIGINAL_TIME + 604_800_000,
        ORIGINAL_TIME,
      ],
    );
  });
  expect(await owner.close()).toEqual({ ok: true, value: undefined });
};

const fingerprint = async (
  application: ReturnType<typeof createMobileApplication>,
): Promise<string> => {
  const result = await application.transaction.execute(async (scope) => {
    const executor = application.transaction.executorFor(scope);
    const objects = await executor.getAll<unknown>(
      `SELECT type, name, tbl_name, sql FROM sqlite_master
       WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name`,
      [],
    );
    const rows: Record<string, readonly unknown[]> = {};
    for (const table of INITIAL_SCHEMA_TABLES) {
      rows[table] = await executor.getAll<unknown>(
        `SELECT * FROM ${table} ORDER BY rowid`,
        [],
      );
    }
    return { ok: true as const, value: JSON.stringify({ objects, rows }) };
  });
  if (!result.ok) throw new Error('fingerprint_failed');
  return result.value;
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('US-02-08 real SQLite confirmed reset', () => {
  it.each([
    'DELETE FROM analytics_events',
    'DELETE FROM owned_items',
    'DELETE FROM purchase_transactions',
    'DELETE FROM reward_transactions',
    'DELETE FROM sessions',
    'DELETE FROM store_review_attempts',
    'DELETE FROM app_settings',
    'DELETE FROM app_installation',
    'DELETE FROM pet_profiles',
    'INSERT INTO app_installation',
    'INSERT INTO app_settings',
    'INSERT INTO pet_profiles',
  ])('rolls back the complete fingerprint when %s fails', async (statement) => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0208-fault-'));
    temporaryDirectories.push(directory);
    const databaseName = 'confirmed-reset-fault.db';
    const driver = new ResetHostDriver(directory);
    await prepareProductFixture(driver, databaseName);
    const application = createMobileApplication({
      clock: { nowMs: () => RESET_TIME },
      confirmedResetDiagnostics: { record: () => undefined },
      databaseName,
      diagnosticsEnabled: false,
      id: { nextId: () => 'new-fault-id' },
      sqliteDriver: driver,
    });
    await application.boot();
    const before = await fingerprint(application);
    driver.failRunContaining = statement;

    expect(await application.confirmedReset.execute()).toMatchObject({
      ok: false,
      error: { code: 'RESET_PERSISTENCE_FAILED' },
    });
    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    expect(await fingerprint(application)).toBe(before);
    await application.dispose();
  });

  it('lets dispose win before the reset transaction without resurrecting the graph', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0208-dispose-'));
    temporaryDirectories.push(directory);
    const driver = new ResetHostDriver(directory);
    let releaseCleanup: (() => void) | undefined;
    const application = createMobileApplication({
      clock: { nowMs: () => RESET_TIME },
      confirmedResetDiagnostics: { record: () => undefined },
      databaseName: 'confirmed-reset-dispose.db',
      diagnosticsEnabled: false,
      id: { nextId: () => 'dispose-reset-id' },
      resetNotificationCleanup: {
        cancelKnownSession: () =>
          new Promise((resolve) => {
            releaseCleanup = () => resolve({ ok: true, value: undefined });
          }),
      },
      sqliteDriver: driver,
    });
    await application.boot();

    const reset = application.confirmedReset.execute();
    await vi.waitFor(() => {
      expect(application.bootstrap.getSnapshot().status).toBe('maintenance');
      expect(releaseCleanup).toBeTypeOf('function');
    });
    const dispose = application.dispose();
    releaseCleanup?.();

    expect(await reset).toMatchObject({
      ok: false,
      error: { code: 'RESET_TRANSACTION_FAILED' },
    });
    await dispose;
    expect(application.bootstrap.getSnapshot().status).toBe('disposed');
  });

  it('rolls back an injected mid-reset failure, then commits exact fresh state and reboots', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0208-'));
    temporaryDirectories.push(directory);
    const databaseName = 'confirmed-reset.db';
    const driver = new ResetHostDriver(directory);
    await prepareProductFixture(driver, databaseName);
    const diagnostics: ConfirmedResetDiagnostic[] = [];
    const cleanupCalls: (string | null)[] = [];
    const notificationCleanup: ResetNotificationCleanupPort = {
      cancelKnownSession: (sessionId) => {
        cleanupCalls.push(sessionId);
        return Promise.resolve({
          ok: false,
          error: {
            kind: 'reset_notification_cleanup_error',
            code: 'RESET_NOTIFICATION_CLEANUP_FAILED',
          },
        });
      },
    };
    let nextId = 0;
    const application = createMobileApplication({
      clock: { nowMs: () => RESET_TIME },
      confirmedResetDiagnostics: { record: (event) => diagnostics.push(event) },
      databaseName,
      diagnosticsEnabled: false,
      id: { nextId: () => `new-anonymous-id-${++nextId}` },
      resetNotificationCleanup: notificationCleanup,
      sqliteDriver: driver,
    });

    await application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    const before = await fingerprint(application);

    driver.failRunContaining = 'DELETE FROM reward_transactions';
    const failed = await application.confirmedReset.execute();
    expect(failed).toMatchObject({
      ok: false,
      error: { code: 'RESET_PERSISTENCE_FAILED' },
    });
    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    expect(await fingerprint(application)).toBe(before);

    application.criticalRecovery.enterRecovery('DATABASE_WRITE_FAILED');
    expect(application.bootstrap.getSnapshot().status).toBe('recovery');
    const first = application.confirmedReset.execute();
    const second = application.confirmedReset.execute();
    const retryDuringReset = application.retryRecovery();
    expect(second).toBe(first);
    await retryDuringReset;
    const reset = await first;
    expect(reset).toMatchObject({
      ok: true,
      warnings: [{ code: 'NOTIFICATION_CLEANUP_FAILED' }],
      value: {
        snapshot: {
          installation: { installedAt: RESET_TIME, onboardingCompletedAt: null },
          settings: {
            focusDurationMinutes: 25,
            defaultMode: 'relax',
            analyticsEnabled: true,
          },
          profile: { totalXp: 0, coinBalance: 0 },
          catalog: { length: 12 },
        },
        persistence: {
          clearedAnalyticsEvents: 1,
          clearedOwnedItems: 1,
          clearedPurchaseTransactions: 1,
          clearedRewardTransactions: 1,
          clearedSessions: 1,
          clearedStoreReviewAttempts: 1,
        },
      },
    });
    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    expect(cleanupCalls).toEqual([null, null]);

    const durable = await application.transaction.execute(async (scope) => {
      const executor = application.transaction.executorFor(scope);
      const counts = await executor.getFirst<Record<string, number>>(
        `SELECT
          (SELECT COUNT(*) FROM sessions) AS sessions,
          (SELECT COUNT(*) FROM reward_transactions) AS rewards,
          (SELECT COUNT(*) FROM purchase_transactions) AS purchases,
          (SELECT COUNT(*) FROM owned_items) AS owned,
          (SELECT COUNT(*) FROM store_review_attempts) AS reviews,
          (SELECT COUNT(*) FROM analytics_events) AS analytics,
          (SELECT COUNT(*) FROM catalog_items) AS catalog,
          (SELECT COUNT(*) FROM schema_migrations) AS migrations`,
        [],
      );
      const installation = await executor.getFirst<{
        anonymous_analytics_id: string;
      }>('SELECT anonymous_analytics_id FROM app_installation WHERE id = 1', []);
      return { ok: true as const, value: { counts, installation } };
    });
    expect(durable).toMatchObject({
      ok: true,
      value: {
        counts: {
          sessions: 0,
          rewards: 0,
          purchases: 0,
          owned: 0,
          reviews: 0,
          analytics: 0,
          catalog: 12,
          migrations: 1,
        },
        installation: { anonymous_analytics_id: 'new-anonymous-id-2' },
      },
    });
    expect(diagnostics.map(({ eventName }) => eventName)).toContain(
      'confirmed_reset_ready',
    );
    expect(JSON.stringify(diagnostics)).not.toContain('raw injected reset failure');
    await application.dispose();
  });
});
