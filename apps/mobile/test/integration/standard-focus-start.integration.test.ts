import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';

import {
  FirstUseEntryController,
  StandardFocusSessionController,
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

const temporaryDirectories: string[] = [];
const now = 1_788_336_000_000;

const values = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) throw new Error('positional parameters required');
  return parameters.map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value) as SQLInputValue[];
};

const run = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...values(parameters));

class HostConnection {
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

class HostDriver implements SQLiteDriver {
  constructor(private readonly directory: string) {}
  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return Promise.resolve(
      new HostConnection(new DatabaseSync(join(this.directory, databaseName))) as unknown as SQLiteConnection,
    );
  }
  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

const openDatabase = async (driver: SQLiteDriver, databaseName: string) => {
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

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('Standard Focus Start SQLite integration', () => {
  it('commits once, survives reopen, restores Session and routes cold entry', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0601-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus.db';
    const first = await openDatabase(driver, databaseName);
    let id = 0;
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => `focus-${++id}` },
      sessions: first.graph.sessions,
      transaction: first.transaction,
    });

    const started = await start.execute({
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
    });
    expect(started).toMatchObject({
      ok: true,
      value: {
        outcome: 'started',
        session: {
          id: 'focus-1',
          focusVariant: 'standard',
          mode: 'strict',
          workTag: 'study',
          endsAt: now + 1_500_000,
        },
      },
    });
    expect(await start.execute({
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
    })).toMatchObject({
      ok: false,
      error: { code: 'SESSION_START_CONFLICT' },
    });
    expect(await first.graph.installation.setOnboardingCompleted(now - 1, now - 1))
      .toMatchObject({ ok: true, value: 'updated' });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const session = new StandardFocusSessionController({ sessions: reopened.graph.sessions });
    await session.refresh();
    expect(session.getSnapshot()).toEqual({
      status: 'ready',
      sessionId: 'focus-1',
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
      startedAt: now,
      endsAt: now + 1_500_000,
    });
    const entry = new FirstUseEntryController({
      installation: reopened.graph.installation,
      sessions: reopened.graph.sessions,
    });
    await entry.refresh();
    expect(entry.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'standard_focus_running',
    });
    await reopened.owner.close();
  });
});
