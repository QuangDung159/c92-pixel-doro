import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';

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

const directories: string[] = [];
const values = (parameters: SQLiteParameters): SQLInputValue[] =>
  (Array.isArray(parameters) ? parameters : []).map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value) as SQLInputValue[];

class Connection {
  constructor(private readonly database: DatabaseSync) {}
  closeAsync = async () => { this.database.close(); };
  execAsync = async (sql: string) => { this.database.exec(sql); };
  runAsync = async (sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> => {
    const result = this.database.prepare(sql).run(...values(parameters));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  };
  getFirstAsync = async <TRow,>(sql: string, parameters: SQLiteParameters): Promise<TRow | null> =>
    (this.database.prepare(sql).get(...values(parameters)) as TRow | undefined) ?? null;
  getAllAsync = async <TRow,>(sql: string, parameters: SQLiteParameters): Promise<TRow[]> =>
    this.database.prepare(sql).all(...values(parameters)) as TRow[];
}

class Driver implements SQLiteDriver {
  constructor(private readonly directory: string) {}
  openDatabase = async (databaseName: string): Promise<SQLiteConnection> =>
    new Connection(new DatabaseSync(join(this.directory, databaseName))) as unknown as SQLiteConnection;
  deleteDatabase = async (databaseName: string): Promise<void> => {
    await rm(join(this.directory, databaseName), { force: true });
  };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('EPIC-10 real SQLite settings persistence', () => {
  it('preserves unrelated columns and survives a database reopen', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us-10-01-'));
    directories.push(directory);
    const driver = new Driver(directory);
    const firstOwner = new SQLiteDatabaseOwner('settings-persistence.db', driver);
    const firstTransaction = new SQLiteTransaction(firstOwner);
    expect(await firstOwner.open()).toEqual({ ok: true, value: undefined });
    expect(await new MigrationRunner({
      owner: firstOwner,
      transaction: firstTransaction,
      registry: productionMigrationRegistry,
      clock: { nowMs: () => 1_000 },
      id: { nextId: () => 'settings-installation' },
    }).migrate()).toMatchObject({ ok: true });
    const firstGraph = createSQLitePersistenceGraph(firstOwner, firstTransaction);
    expect(await firstGraph.settings.patch({
      focusDurationMinutes: 50, updatedAt: 2_000,
    })).toEqual({ ok: true, value: 'updated' });
    expect(await firstGraph.settings.patch({
      defaultMode: 'strict', updatedAt: 2_001,
    })).toEqual({ ok: true, value: 'updated' });
    expect(await firstGraph.settings.patch({
      analyticsEnabled: false, updatedAt: 2_002,
    })).toEqual({ ok: true, value: 'updated' });
    await firstOwner.close();

    const reopenedOwner = new SQLiteDatabaseOwner('settings-persistence.db', driver);
    expect(await reopenedOwner.open()).toEqual({ ok: true, value: undefined });
    const reopened = createSQLitePersistenceGraph(
      reopenedOwner,
      new SQLiteTransaction(reopenedOwner),
    );
    expect(await reopened.settings.find()).toMatchObject({
      ok: true,
      value: {
        focusDurationMinutes: 50,
        defaultMode: 'strict',
        analyticsEnabled: false,
        soundEnabled: true,
        hapticsEnabled: true,
        notificationsEnabled: true,
      },
    });
    await reopenedOwner.close();
  });
});
