import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RecoveryDiagnostic } from '@/application';
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

const TIMESTAMP = 1_787_836_800_000;
const temporaryDirectories: string[] = [];

const positionalParameters = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) {
    throw new Error('host_driver_requires_positional_parameters');
  }
  return parameters.map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value,
  ) as SQLInputValue[];
};

const bindRun = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...positionalParameters(parameters));

const bindGet = <TRow>(
  statement: StatementSync,
  parameters: SQLiteParameters,
): TRow | undefined =>
  statement.get(...positionalParameters(parameters)) as TRow | undefined;

const bindAll = <TRow>(
  statement: StatementSync,
  parameters: SQLiteParameters,
): TRow[] =>
  statement.all(...positionalParameters(parameters)) as TRow[];

class FaultInjectingHostConnection {
  constructor(
    private readonly database: DatabaseSync,
    private readonly driver: FaultInjectingHostDriver,
  ) {}

  closeAsync(): Promise<void> {
    this.database.close();
    return Promise.resolve();
  }

  execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
    return Promise.resolve();
  }

  runAsync(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<SQLiteWriteResult> {
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
      bindGet<TRow>(this.database.prepare(sql), parameters) ?? null,
    );
  }

  getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    if (sql === 'PRAGMA integrity_check' && this.driver.failIntegrityReads > 0) {
      this.driver.failIntegrityReads -= 1;
      return Promise.reject(new Error('raw host sqlite detail'));
    }
    return Promise.resolve(bindAll<TRow>(this.database.prepare(sql), parameters));
  }
}

class FaultInjectingHostDriver implements SQLiteDriver {
  openCalls = 0;
  failIntegrityReads = 0;

  constructor(private readonly directory: string) {}

  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    this.openCalls += 1;
    return Promise.resolve(
      new FaultInjectingHostConnection(
        new DatabaseSync(join(this.directory, databaseName)),
        this,
      ) as unknown as SQLiteConnection,
    );
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

const prepareDurableDatabase = async (
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
    clock: { nowMs: () => TIMESTAMP },
    id: { nextId: () => 'failure-recovery-installation-id' },
  });
  expect(await migration.migrate()).toMatchObject({ ok: true });

  await owner.withConnection(async (connection) => {
    await connection.runAsync(
      `INSERT INTO sessions (
        id, profile_id, session_type, focus_variant, mode, status, work_tag,
        configured_duration_minutes, started_at, ends_at, backgrounded_at,
        resolved_at, xp_earned, coins_earned, reward_claimed_at,
        scheduled_end_local_date, scheduled_end_utc_offset_minutes,
        created_at, updated_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, 0, NULL, ?, ?, ?, ?)`,
      [
        'recovery-retained-session',
        'focus',
        'standard',
        'relax',
        'cancelled',
        'coding',
        25,
        TIMESTAMP,
        TIMESTAMP + 1_500_000,
        TIMESTAMP + 60_000,
        '2026-08-28',
        420,
        TIMESTAMP,
        TIMESTAMP + 60_000,
      ],
    );
  });
  expect(await owner.close()).toEqual({ ok: true, value: undefined });
};

const durableFingerprint = async (
  application: ReturnType<typeof createMobileApplication>,
): Promise<string> => {
  const result = await application.transaction.execute(async (scope) => {
    const executor = application.transaction.executorFor(scope);
    const objects = await executor.getAll<unknown>(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name NOT LIKE 'sqlite_%'
       ORDER BY type, name`,
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
  if (!result.ok) throw new Error('failure_recovery_fingerprint_failed');
  return result.value;
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('US-02-07 real SQLite failure recovery', () => {
  it('retains durable rows, retries the same database, and distinguishes side effects from core failures', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0207-'));
    temporaryDirectories.push(directory);
    const databaseName = 'failure-recovery.db';
    const driver = new FaultInjectingHostDriver(directory);
    await prepareDurableDatabase(driver, databaseName);
    driver.failIntegrityReads = 1;
    const diagnostics: RecoveryDiagnostic[] = [];
    const application = createMobileApplication({
      databaseName,
      diagnosticsEnabled: false,
      recoveryDiagnostics: {
        record: (diagnostic) => diagnostics.push(diagnostic),
      },
      sqliteDriver: driver,
      appLifecycle: {
        getCurrentState: () => 'active',
        subscribe: () => () => undefined,
      },
    });

    await application.boot();
    expect(application.bootstrap.getSnapshot()).toMatchObject({
      status: 'recovery',
      phase: 'verifying',
      error: { code: 'DATABASE_READ_FAILED' },
    });
    expect(application.readiness.run(() => 'forbidden')).toMatchObject({
      ok: false,
    });
    const beforeRetry = await durableFingerprint(application);

    const firstRetry = application.retryRecovery();
    const secondRetry = application.retryRecovery();
    expect(secondRetry).toBe(firstRetry);
    await Promise.all([firstRetry, secondRetry]);

    expect(application.bootstrap.getSnapshot()).toMatchObject({
      status: 'ready',
      snapshot: { migrationVersion: 1 },
    });
    expect(driver.openCalls).toBe(3);
    expect(await durableFingerprint(application)).toBe(beforeRetry);

    const sideEffectFailure = await application.persistence.analyticsQueue.enqueueBounded(
      {
        eventId: 'forbidden-event',
        eventName: 'history_viewed',
        properties: { forbiddenFreeText: 'must-not-persist' },
        occurredAt: TIMESTAMP,
        expiresAt: TIMESTAMP + 604_800_000,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: TIMESTAMP,
      },
      TIMESTAMP,
    );
    expect(sideEffectFailure).toMatchObject({ ok: false });
    expect(application.bootstrap.getSnapshot()).toMatchObject({ status: 'ready' });

    const beforeCoreFailure = await durableFingerprint(application);
    const rolledBack = await application.transaction.execute(async (scope) => {
      await application.transaction
        .executorFor(scope)
        .run('UPDATE pet_profiles SET coin_balance = 1 WHERE id = 1', []);
      return { ok: false as const, error: { code: 'INJECTED_CORE_FAILURE' } };
    });
    expect(rolledBack).toEqual({
      ok: false,
      error: { code: 'INJECTED_CORE_FAILURE' },
    });
    application.criticalRecovery.enterRecovery('DATABASE_WRITE_FAILED');
    expect(application.bootstrap.getSnapshot()).toEqual({
      status: 'recovery',
      phase: 'runtime',
      error: { code: 'DATABASE_WRITE_FAILED' },
    });
    expect(await durableFingerprint(application)).toBe(beforeCoreFailure);

    await application.retryRecovery();
    expect(application.bootstrap.getSnapshot()).toMatchObject({ status: 'ready' });
    expect(await durableFingerprint(application)).toBe(beforeCoreFailure);
    expect(
      diagnostics.every(
        (diagnostic) =>
          Object.keys(diagnostic).sort().join(',') ===
          'attemptNumber,eventName,phase,reasonCode',
      ),
    ).toBe(true);
    expect(JSON.stringify(diagnostics)).not.toContain('raw host sqlite detail');
    expect(JSON.stringify(diagnostics)).not.toContain('forbiddenFreeText');

    await application.dispose();
  });
});
