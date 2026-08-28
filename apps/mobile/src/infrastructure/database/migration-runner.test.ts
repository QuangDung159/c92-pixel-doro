import { describe, expect, it } from 'vitest';

import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
} from './sqlite-driver';
import { SQLiteDatabaseOwner } from './sqlite-database-owner';
import {
  MigrationRunner,
  migrationInspectionSql,
} from './migration-runner';
import { SQLiteTransaction } from './sqlite-transaction';
import type { MigrationDescriptor } from './migrations/migration-descriptor';

interface HistoryRow {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly applied_at: number;
}

const checksum = (character: string): string => character.repeat(64);

class MigrationTestConnection {
  readonly objects = new Set<string>();
  history: HistoryRow[] = [];
  markers: string[] = [];
  controlStatements: string[] = [];
  queryCount = 0;
  closeCalls = 0;
  failHistoryVersion: number | undefined;
  historyReadFails = false;
  private snapshot:
    | {
        readonly objects: string[];
        readonly history: HistoryRow[];
        readonly markers: string[];
      }
    | undefined;

  async closeAsync(): Promise<void> {
    this.closeCalls += 1;
  }

  async execAsync(sql: string): Promise<void> {
    this.controlStatements.push(sql);
    if (sql === 'BEGIN IMMEDIATE') {
      this.snapshot = this.fingerprint();
      return;
    }
    if (sql === 'ROLLBACK') {
      if (this.snapshot !== undefined) {
        this.restore(this.snapshot);
      }
      this.snapshot = undefined;
      return;
    }
    if (sql === 'COMMIT') {
      this.snapshot = undefined;
      return;
    }
    if (sql === 'CREATE TABLE schema_migrations') {
      this.objects.add('schema_migrations');
      return;
    }
    if (sql === 'CREATE TABLE migration_probe') {
      this.objects.add('migration_probe');
    }
  }

  async runAsync(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const values = parameters as readonly (number | string)[];
    if (sql === migrationInspectionSql.insertHistory) {
      const version = values[0] as number;
      if (this.failHistoryVersion === version) {
        throw new Error('injected_history_failure');
      }
      this.history.push({
        version,
        name: values[1] as string,
        checksum: values[2] as string,
        applied_at: values[3] as number,
      });
      return { lastInsertRowId: version, changes: 1 };
    }
    if (sql === 'INSERT INTO migration_probe(marker) VALUES (?)') {
      this.markers.push(values[0] as string);
      return { lastInsertRowId: this.markers.length, changes: 1 };
    }
    throw new Error(`unexpected_run:${sql}`);
  }

  async getFirstAsync<TRow>(
    sql: string,
    _parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    this.queryCount += 1;
    if (sql === 'PRAGMA foreign_keys') {
      return { foreign_keys: 1 } as TRow;
    }
    if (sql === migrationInspectionSql.latestVersion) {
      return {
        version: this.history.at(-1)?.version ?? null,
      } as TRow;
    }
    throw new Error(`unexpected_first:${sql}`);
  }

  async getAllAsync<TRow>(
    sql: string,
    _parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    this.queryCount += 1;
    if (sql === migrationInspectionSql.userObjects) {
      return [...this.objects]
        .sort()
        .map((name) => ({ type: 'table', name })) as TRow[];
    }
    if (sql === migrationInspectionSql.history) {
      if (this.historyReadFails) {
        throw new Error('injected_history_read_failure');
      }
      return this.history.map((row) => ({ ...row })) as TRow[];
    }
    throw new Error(`unexpected_all:${sql}`);
  }

  fingerprint() {
    return {
      objects: [...this.objects].sort(),
      history: this.history.map((row) => ({ ...row })),
      markers: [...this.markers],
    };
  }

  asConnection(): SQLiteConnection {
    return this as unknown as SQLiteConnection;
  }

  private restore(snapshot: ReturnType<MigrationTestConnection['fingerprint']>) {
    this.objects.clear();
    snapshot.objects.forEach((name) => this.objects.add(name));
    this.history = snapshot.history.map((row) => ({ ...row }));
    this.markers = [...snapshot.markers];
  }
}

class MigrationTestDriver implements SQLiteDriver {
  openCalls = 0;
  readonly deleteCalls: string[] = [];

  constructor(readonly connection: MigrationTestConnection) {}

  async openDatabase(): Promise<SQLiteConnection> {
    this.openCalls += 1;
    return this.connection.asConnection();
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    this.deleteCalls.push(databaseName);
  }
}

const descriptor = (
  version: number,
  options: {
    readonly fail?: () => boolean;
    readonly name?: string;
    readonly checksum?: string;
  } = {},
): MigrationDescriptor => {
  const name = options.name ?? (version === 1 ? 'one' : 'two');
  return {
    version,
    name,
    filename: `${String(version).padStart(3, '0')}_${name}.migration.ts`,
    checksum: options.checksum ?? checksum(version === 1 ? 'a' : 'b'),
    requiresAnonymousAnalyticsId: version === 1,
    apply: async (executor) => {
      if (version === 1) {
        await executor.executeStatic('CREATE TABLE schema_migrations');
        await executor.executeStatic('CREATE TABLE migration_probe');
      }
      await executor.run('INSERT INTO migration_probe(marker) VALUES (?)', [
        `v${version}`,
      ]);
      if (options.fail?.() === true) {
        throw new Error('injected_apply_failure');
      }
    },
  };
};

const createRunner = async (
  connection: MigrationTestConnection,
  registry: readonly MigrationDescriptor[],
) => {
  const driver = new MigrationTestDriver(connection);
  const owner = new SQLiteDatabaseOwner('migration-test.db', driver);
  const transaction = new SQLiteTransaction(owner);
  const openResult = await owner.open();
  expect(openResult.ok).toBe(true);
  connection.controlStatements = [];
  connection.queryCount = 0;
  let clockCalls = 0;
  let idCalls = 0;
  const runner = new MigrationRunner({
    owner,
    transaction,
    registry,
    clock: {
      nowMs: () => {
        clockCalls += 1;
        return 1_700_000_000_000 + clockCalls;
      },
    },
    id: {
      nextId: () => {
        idCalls += 1;
        return `installation-${idCalls}`;
      },
    },
  });
  return {
    driver,
    owner,
    runner,
    calls: () => ({ clockCalls, idCalls }),
  };
};

const seedHistory = (
  connection: MigrationTestConnection,
  descriptors: readonly MigrationDescriptor[],
) => {
  connection.objects.add('schema_migrations');
  connection.objects.add('migration_probe');
  connection.history = descriptors.map((item, index) => ({
    version: item.version,
    name: item.name,
    checksum: item.checksum,
    applied_at: 1_700_000_000_000 + index,
  }));
};

describe('MigrationRunner', () => {
  it('applies empty database migrations in order with per-version history', async () => {
    const connection = new MigrationTestConnection();
    const registry = [
      descriptor(1),
      descriptor(2),
      descriptor(3, { name: 'three', checksum: checksum('c') }),
    ];
    const { runner, calls } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: true,
      value: { fromVersion: 0, toVersion: 3, appliedVersions: [1, 2, 3] },
    });
    expect(connection.markers).toEqual(['v1', 'v2', 'v3']);
    expect(connection.history.map(({ version }) => version)).toEqual([1, 2, 3]);
    expect(connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'CREATE TABLE schema_migrations',
      'CREATE TABLE migration_probe',
      'COMMIT',
      'BEGIN IMMEDIATE',
      'COMMIT',
      'BEGIN IMMEDIATE',
      'COMMIT',
    ]);
    expect(calls()).toEqual({ clockCalls: 3, idCalls: 1 });
  });

  it('returns latest as a no-op without clock, id, or write transaction', async () => {
    const connection = new MigrationTestConnection();
    const registry = [descriptor(1)];
    seedHistory(connection, registry);
    const before = connection.fingerprint();
    const { runner, calls } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: true,
      value: { fromVersion: 1, toVersion: 1, appliedVersions: [] },
    });
    expect(connection.fingerprint()).toEqual(before);
    expect(connection.controlStatements).toEqual([]);
    expect(calls()).toEqual({ clockCalls: 0, idCalls: 0 });
  });

  it.each([
    { name: 'empty', registry: [] },
    { name: 'invalid checksum', registry: [{ ...descriptor(1), checksum: 'bad' }] },
    { name: 'version gap', registry: [descriptor(2)] },
    {
      name: 'duplicate version',
      registry: [descriptor(1), { ...descriptor(2), version: 1 }],
    },
    {
      name: 'duplicate name',
      registry: [
        descriptor(1),
        descriptor(2, { name: 'one', checksum: checksum('b') }),
      ],
    },
  ])('rejects $name registry before database inspection', async ({ registry }) => {
    const connection = new MigrationTestConnection();
    const { runner } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'migration_error',
        code: 'MIGRATION_REGISTRY_INVALID',
      },
    });
    expect(connection.queryCount).toBe(0);
    expect(connection.controlStatements).toEqual([]);
  });

  it.each([
    {
      name: 'non-empty database without history',
      arrange: (connection: MigrationTestConnection) => {
        connection.objects.add('product_table');
      },
      code: 'MIGRATION_HISTORY_MISSING',
    },
    {
      name: 'empty history beside product schema',
      arrange: (connection: MigrationTestConnection) => {
        connection.objects.add('schema_migrations');
        connection.objects.add('product_table');
      },
      code: 'MIGRATION_HISTORY_MISSING',
    },
    {
      name: 'unknown applied name',
      arrange: (connection: MigrationTestConnection) => {
        seedHistory(connection, [{ ...descriptor(1), name: 'unknown' }]);
      },
      code: 'MIGRATION_UNKNOWN_APPLIED',
    },
    {
      name: 'checksum drift',
      arrange: (connection: MigrationTestConnection) => {
        seedHistory(connection, [{ ...descriptor(1), checksum: checksum('f') }]);
      },
      code: 'MIGRATION_CHECKSUM_MISMATCH',
    },
    {
      name: 'newer schema',
      arrange: (connection: MigrationTestConnection) => {
        seedHistory(connection, [descriptor(1)]);
        connection.history.push({
          version: 2,
          name: 'two',
          checksum: checksum('b'),
          applied_at: 1_700_000_000_002,
        });
      },
      code: 'DATABASE_SCHEMA_NEWER_THAN_BINARY',
    },
  ])('fails safely for $name', async ({ arrange, code }) => {
    const connection = new MigrationTestConnection();
    arrange(connection);
    const before = connection.fingerprint();
    const { runner, driver } = await createRunner(connection, [descriptor(1)]);

    const result = await runner.migrate();
    expect(result).toEqual({
      ok: false,
      error: { kind: 'migration_error', code },
    });
    expect(connection.fingerprint()).toEqual(before);
    expect(connection.controlStatements).toEqual([]);
    expect(driver.deleteCalls).toEqual([]);
  });

  it('rejects a history gap before applying its pending suffix', async () => {
    const connection = new MigrationTestConnection();
    const registry = [
      descriptor(1),
      descriptor(2),
      descriptor(3, { name: 'three', checksum: checksum('c') }),
    ];
    seedHistory(connection, [registry[0]!]);
    connection.history.push({
      version: 3,
      name: 'three',
      checksum: checksum('c'),
      applied_at: 1_700_000_000_003,
    });
    const before = connection.fingerprint();
    const { runner } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'migration_error',
        code: 'MIGRATION_VERSION_GAP',
      },
    });
    expect(connection.fingerprint()).toEqual(before);
    expect(connection.controlStatements).toEqual([]);
  });

  it('rolls back only the failing migration and retries from durable history', async () => {
    const connection = new MigrationTestConnection();
    let shouldFail = true;
    const registry = [
      descriptor(1),
      descriptor(2, { fail: () => shouldFail }),
    ];
    const { runner } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: false,
      error: { kind: 'migration_error', code: 'MIGRATION_APPLY_FAILED' },
    });
    expect(connection.history.map(({ version }) => version)).toEqual([1]);
    expect(connection.markers).toEqual(['v1']);

    shouldFail = false;
    await expect(runner.migrate()).resolves.toEqual({
      ok: true,
      value: { fromVersion: 1, toVersion: 2, appliedVersions: [2] },
    });
    expect(connection.history.map(({ version }) => version)).toEqual([1, 2]);
    expect(connection.markers).toEqual(['v1', 'v2']);
  });

  it('rolls back applied work when history insert fails, then retries once', async () => {
    const connection = new MigrationTestConnection();
    const registry = [descriptor(1), descriptor(2)];
    seedHistory(connection, [registry[0]!]);
    const before = connection.fingerprint();
    connection.failHistoryVersion = 2;
    const { runner } = await createRunner(connection, registry);

    await expect(runner.migrate()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'migration_error',
        code: 'MIGRATION_HISTORY_WRITE_FAILED',
      },
    });
    expect(connection.fingerprint()).toEqual(before);

    connection.failHistoryVersion = undefined;
    await expect(runner.migrate()).resolves.toEqual({
      ok: true,
      value: { fromVersion: 1, toVersion: 2, appliedVersions: [2] },
    });
    expect(connection.markers).toEqual(['v2']);
    expect(connection.history.map(({ version }) => version)).toEqual([1, 2]);
  });

  it('maps unreadable history without leaking provider detail', async () => {
    const connection = new MigrationTestConnection();
    seedHistory(connection, [descriptor(1)]);
    connection.historyReadFails = true;
    const { runner } = await createRunner(connection, [descriptor(1)]);

    await expect(runner.migrate()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'migration_error',
        code: 'MIGRATION_HISTORY_INVALID',
      },
    });
  });
});
