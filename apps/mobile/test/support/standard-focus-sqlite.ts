import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { expect } from 'vitest';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type { SQLiteConnection, SQLiteDriver, SQLiteParameters, SQLiteWriteResult } from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

export const now = 1_788_336_000_000;
const values = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) throw new Error('positional parameters required');
  return parameters.map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value) as SQLInputValue[];
};

const run = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...values(parameters));

class HostConnection {
  constructor(private readonly database: DatabaseSync, private readonly beforeExec: (sql: string) => void) {}
  closeAsync(): Promise<void> {
    this.database.close();
    return Promise.resolve();
  }
  execAsync(sql: string): Promise<void> {
    this.beforeExec(sql);
    this.database.exec(sql);
    return Promise.resolve();
  }
  runAsync(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> {
    const result = run(this.database.prepare(sql), parameters);
    return Promise.resolve({
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    } as SQLiteWriteResult);
  }
  getFirstAsync<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow | null> {
    return Promise.resolve(
      this.database.prepare(sql).get(...values(parameters)) as TRow | undefined ?? null,
    );
  }
  getAllAsync<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow[]> {
    return Promise.resolve(
      this.database.prepare(sql).all(...values(parameters)) as TRow[],
    );
  }
}

export class HostDriver implements SQLiteDriver {
  private rejectCommit = false;
  constructor(private readonly directory: string) {}
  failNextCommit(): void { this.rejectCommit = true; }
  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return Promise.resolve(
      new HostConnection(new DatabaseSync(join(this.directory, databaseName)), (sql) => {
        if (this.rejectCommit && /^COMMIT\b/i.test(sql.trim())) {
          this.rejectCommit = false;
          throw new Error('Injected commit failure');
        }
      }) as unknown as SQLiteConnection,
    );
  }
  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

export const openDatabase = async (driver: SQLiteDriver, databaseName: string) => {
  const owner = new SQLiteDatabaseOwner(databaseName, driver);
  expect(await owner.open()).toEqual({ ok: true, value: undefined });
  const transaction = new SQLiteTransaction(owner);
  const graph = createSQLitePersistenceGraph(owner, transaction);
  const migration = new MigrationRunner({
    owner,
    transaction,
    registry: productionMigrationRegistry,
    clock: { nowMs: () => now },
    id: { nextId: () => 'installation-id' },
  });
  expect(await migration.migrate()).toMatchObject({ ok: true, value: { toVersion: 1 } });
  return { graph, owner, transaction };
};
