import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CancelStandardFocusUseCase,
  LoadStandardFocusCancelledResultUseCase,
  RecordStrictBackgroundUseCase,
  ReconcileStandardFocusUseCase,
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
import { createMobileApplication } from '@/composition/create-mobile-application';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

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
  vi.unstubAllGlobals();
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('Standard Focus Start SQLite integration', () => {
  it('commits Relax cancel, preserves zero reward and reloads the exact Result', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0602-cancel-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus-cancel.db';
    const first = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now }, coordinator,
      id: { nextId: () => 'relax-1' }, sessions: first.graph.sessions,
      transaction: first.transaction,
    });
    expect(await start.execute({
      durationMinutes: 15, mode: 'relax', workTag: 'coding',
    })).toMatchObject({ ok: true, value: { session: { id: 'relax-1' } } });
    const profileBefore = await first.graph.profile.find();
    const cancel = new CancelStandardFocusUseCase({
      clock: { nowMs: () => now + 1_000 }, coordinator,
      sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await cancel.execute('relax-1')).toEqual({
      ok: true, value: { outcome: 'cancelled', sessionId: 'relax-1' },
    });
    expect(await first.graph.sessions.findActive()).toEqual({ ok: true, value: null });
    expect(await first.graph.rewards.findBySessionId('relax-1')).toEqual({ ok: true, value: null });
    expect(await first.graph.profile.find()).toEqual(profileBefore);
    expect(await cancel.execute('relax-1')).toEqual({
      ok: true, value: { outcome: 'already_cancelled', sessionId: 'relax-1' },
    });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const loadResult = new LoadStandardFocusCancelledResultUseCase({
      sessions: reopened.graph.sessions,
    });
    expect(await loadResult.execute('relax-1')).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          sessionId: 'relax-1', mode: 'relax', workTag: 'coding',
          durationMinutes: 15, resolvedAt: now + 1_000, xpEarned: 0, coinsEarned: 0,
        },
      },
    });
    expect(await loadResult.execute('other')).toEqual({
      ok: true, value: { outcome: 'missing' },
    });
    await reopened.owner.close();
  });

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
    const session = new StandardFocusSessionController({
      clock: { nowMs: () => now },
      scheduler: { schedule: () => () => undefined },
      sessions: reopened.graph.sessions,
    });
    await session.refresh();
    expect(session.getSnapshot()).toEqual({
      status: 'ready',
      phase: 'running',
      sessionId: 'focus-1',
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
      startedAt: now,
      endsAt: now + 1_500_000,
      remainingMs: 1_500_000,
      displaySeconds: 1_500,
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

  it('persists Strict episodes, clears a safe return and commits a proven failure once', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0603-strict-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus-strict.db';
    const first = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now }, coordinator,
      id: { nextId: () => 'strict-1' }, sessions: first.graph.sessions,
      transaction: first.transaction,
    });
    expect(await start.execute({
      durationMinutes: 15, mode: 'strict', workTag: 'study',
    })).toMatchObject({ ok: true, value: { session: { id: 'strict-1' } } });
    const record = new RecordStrictBackgroundUseCase({
      coordinator, sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await record.execute(now + 1_000)).toMatchObject({
      ok: true, value: { outcome: 'recorded' },
    });
    let reconcileNow = now + 10_999;
    const reconcile = new ReconcileStandardFocusUseCase({
      clock: { nowMs: () => reconcileNow }, coordinator,
      sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await reconcile.execute()).toMatchObject({
      ok: true, value: { outcome: 'safe_episode_cleared' },
    });
    expect(await first.graph.sessions.findActive()).toMatchObject({
      ok: true, value: { id: 'strict-1', backgroundedAt: null, status: 'running' },
    });

    expect(await record.execute(now + 20_000)).toMatchObject({
      ok: true, value: { outcome: 'recorded' },
    });
    reconcileNow = now + 30_000;
    expect(await reconcile.execute()).toEqual({
      ok: true,
      value: {
        outcome: 'failed', sessionId: 'strict-1',
        freshness: 'fresh_commit', resolvedAt: now + 30_000,
      },
    });
    expect(await first.graph.sessions.findActive()).toEqual({ ok: true, value: null });
    expect(await first.graph.rewards.findBySessionId('strict-1')).toEqual({
      ok: true, value: null,
    });
    expect(await reconcile.execute('strict-1')).toMatchObject({
      ok: true,
      value: { outcome: 'failed', freshness: 'existing_terminal' },
    });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const result = new LoadStandardFocusCancelledResultUseCase({
      sessions: reopened.graph.sessions,
    });
    expect(await result.execute('strict-1')).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          status: 'failed', mode: 'strict', sessionId: 'strict-1',
          backgroundedAt: now + 20_000, xpEarned: 0, coinsEarned: 0,
        },
      },
    });
    await reopened.owner.close();
  });

  it('uses the dev-only CTA operation to confirmed-reset local data and return first use', async () => {
    vi.stubGlobal('__DEV__', true);
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0601-reset-'));
    temporaryDirectories.push(directory);
    let id = 0;
    const application = createMobileApplication({
      appLifecycle: {
        getCurrentState: () => 'active',
        subscribe: () => vi.fn(),
      },
      clock: { nowMs: () => now },
      databaseName: 'standard-focus-reset.db',
      id: { nextId: () => `review-${++id}` },
      localCalendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      sqliteDriver: new HostDriver(directory),
    });

    await application.boot();
    expect(application.standardFocusReviewResetAvailable).toBe(true);
    expect(await application.standardFocusSetup.start()).toMatchObject({ ok: true });
    expect(await application.persistence.sessions.findActive()).toMatchObject({
      ok: true,
      value: { focusVariant: 'standard', status: 'running' },
    });

    expect(await application.resetStandardFocusReviewData()).toBe(true);
    expect(await application.persistence.sessions.findActive()).toEqual({
      ok: true,
      value: null,
    });
    expect(application.firstUseEntry.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'onboarding_intro',
    });
    await application.dispose();
  });
});
