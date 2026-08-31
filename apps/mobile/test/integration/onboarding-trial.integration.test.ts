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
  CancelOnboardingTrialUseCase,
  CompleteOnboardingTrialUseCase,
  LoadOnboardingTrialResultUseCase,
  persistenceError,
  SessionCommandCoordinator,
  StartOnboardingTrialUseCase,
} from '@pixeldoro/application';
import {
  CompleteFirstUseHandoffUseCase,
  FirstUseEntryController,
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
const initialNow = 1_788_163_200_000;

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

const openGraph = async (driver: SQLiteDriver, databaseName: string) => {
  const owner = new SQLiteDatabaseOwner(databaseName, driver);
  expect(await owner.open()).toEqual({ ok: true, value: undefined });
  const transaction = new SQLiteTransaction(owner);
  return {
    owner,
    transaction,
    graph: createSQLitePersistenceGraph(owner, transaction),
  };
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })),
  );
});

describe('onboarding trial SQLite integration', () => {
  it('commits one trial, survives reopen, and cancels without reward/profile mutation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0502-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'onboarding-trial.db';
    const first = await openGraph(driver, databaseName);
    let idCounter = 0;
    const id = { nextId: () => `us0502-${++idCounter}` };
    const clock = { nowMs: () => initialNow };
    const migration = new MigrationRunner({
      owner: first.owner,
      transaction: first.transaction,
      registry: productionMigrationRegistry,
      clock,
      id,
    });
    expect(await migration.migrate()).toMatchObject({ ok: true });

    const coordinator = new SessionCommandCoordinator();
    const start = new StartOnboardingTrialUseCase({
      calendar: {
        snapshot: () => ({
          ok: true,
          value: { localDate: '2026-08-31', utcOffsetMinutes: 420 },
        }),
      },
      clock,
      coordinator,
      id,
      sessions: first.graph.sessions,
      transaction: first.transaction,
    });

    const [one, two] = await Promise.all([start.execute(), start.execute()]);
    expect([one, two].map((result) => result.ok ? result.value.outcome : 'error').sort())
      .toEqual(['already_running', 'started']);
    const active = await first.graph.sessions.findActive();
    expect(active).toMatchObject({
      ok: true,
      value: {
        status: 'running',
        focusVariant: 'onboarding_trial',
        configuredDurationMinutes: 5,
        mode: 'relax',
        workTag: null,
        startedAt: initialNow,
        endsAt: initialNow + 300_000,
      },
    });
    if (!active.ok || active.value === null) throw new Error('missing active trial');
    const sessionId = active.value.id;
    expect(await first.graph.rewards.findBySessionId(sessionId)).toEqual({
      ok: true,
      value: null,
    });
    expect(await first.graph.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 0, coinBalance: 0 },
    });
    await first.owner.close();

    const reopened = await openGraph(driver, databaseName);
    expect(await reopened.graph.sessions.findActive()).toMatchObject({
      ok: true,
      value: { id: sessionId, status: 'running' },
    });
    const cancel = new CancelOnboardingTrialUseCase({
      clock: { nowMs: () => initialNow + 15_000 },
      coordinator: new SessionCommandCoordinator(),
      sessions: reopened.graph.sessions,
      transaction: reopened.transaction,
    });
    expect(await cancel.execute(sessionId)).toEqual({
      ok: true,
      value: { outcome: 'cancelled', sessionId },
    });
    await reopened.owner.close();

    const final = await openGraph(driver, databaseName);
    expect(await final.graph.sessions.findLatestOnboardingTrial()).toMatchObject({
      ok: true,
      value: {
        id: sessionId,
        status: 'cancelled',
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
      },
    });
    expect(await final.graph.rewards.findBySessionId(sessionId)).toEqual({
      ok: true,
      value: null,
    });
    expect(await final.graph.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 0, coinBalance: 0 },
    });
    await final.owner.close();
  });

  it('completes and rewards exactly once across races and reopen', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0503-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'onboarding-completion.db';
    const first = await openGraph(driver, databaseName);
    let idCounter = 0;
    let now = initialNow;
    const id = { nextId: () => `us0503-${++idCounter}` };
    const clock = { nowMs: () => now };
    const migration = new MigrationRunner({
      owner: first.owner,
      transaction: first.transaction,
      registry: productionMigrationRegistry,
      clock,
      id,
    });
    expect(await migration.migrate()).toMatchObject({ ok: true });
    const coordinator = new SessionCommandCoordinator();
    const start = new StartOnboardingTrialUseCase({
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-08-31', utcOffsetMinutes: 420 },
      }) },
      clock,
      coordinator,
      id,
      sessions: first.graph.sessions,
      transaction: first.transaction,
    });
    const started = await start.execute();
    if (!started.ok) throw new Error('trial did not start');
    const sessionId = started.value.session.id;
    now += 300_000;
    const complete = new CompleteOnboardingTrialUseCase({
      clock,
      coordinator,
      id,
      profile: first.graph.profile,
      rewards: first.graph.rewards,
      sessions: first.graph.sessions,
      transaction: first.transaction,
    });

    const outcomes = await Promise.all([
      complete.execute(sessionId),
      complete.execute(sessionId),
    ]);
    expect(outcomes.map((result) => result.ok ? result.value.outcome : 'error').sort())
      .toEqual(['already_completed', 'completed_fresh']);
    expect(await first.graph.sessions.findById(sessionId)).toMatchObject({
      ok: true,
      value: {
        status: 'completed', resolvedAt: now, rewardClaimedAt: now,
        xpEarned: 5, coinsEarned: 1,
      },
    });
    expect(await first.graph.rewards.findBySessionId(sessionId)).toMatchObject({
      ok: true,
      value: {
        sessionId, profileId: 1, xpDelta: 5, coinDelta: 1,
        reason: 'onboarding_trial_completed', createdAt: now,
      },
    });
    expect(await first.graph.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 5, coinBalance: 1 },
    });
    now += 1_000;
    const handoff = new CompleteFirstUseHandoffUseCase({
      clock,
      installation: first.graph.installation,
    });
    expect(await handoff.execute()).toEqual({
      ok: true,
      value: { outcome: 'completed_fresh', completedAt: now },
    });
    now += 1_000;
    expect(await handoff.execute()).toEqual({
      ok: true,
      value: { outcome: 'already_completed', completedAt: now - 1_000 },
    });
    expect(await first.graph.installation.find()).toMatchObject({
      ok: true,
      value: { onboardingCompletedAt: now - 1_000, updatedAt: now - 1_000 },
    });
    expect(await first.graph.sessions.findById(sessionId)).toMatchObject({
      ok: true,
      value: { status: 'completed', xpEarned: 5, coinsEarned: 1 },
    });
    expect(await first.graph.rewards.findBySessionId(sessionId)).toMatchObject({
      ok: true,
      value: { xpDelta: 5, coinDelta: 1 },
    });
    expect(await first.graph.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 5, coinBalance: 1 },
    });
    await first.owner.close();

    const reopened = await openGraph(driver, databaseName);
    const load = new LoadOnboardingTrialResultUseCase({
      profile: reopened.graph.profile,
      rewards: reopened.graph.rewards,
      sessions: reopened.graph.sessions,
    });
    expect(await load.execute()).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: { sessionId, xpEarned: 5, coinsEarned: 1, totalXp: 5, coinBalance: 1 },
      },
    });
    const hydratedComplete = new CompleteOnboardingTrialUseCase({
      clock,
      coordinator: new SessionCommandCoordinator(),
      id,
      profile: reopened.graph.profile,
      rewards: reopened.graph.rewards,
      sessions: reopened.graph.sessions,
      transaction: reopened.transaction,
    });
    expect(await hydratedComplete.execute(sessionId)).toMatchObject({
      ok: true,
      value: { outcome: 'already_completed' },
    });
    expect(await reopened.graph.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 5, coinBalance: 1 },
    });
    expect(await reopened.graph.installation.find()).toMatchObject({
      ok: true,
      value: { onboardingCompletedAt: now - 1_000 },
    });
    const firstUseEntry = new FirstUseEntryController({
      installation: reopened.graph.installation,
      sessions: reopened.graph.sessions,
    });
    await firstUseEntry.refresh();
    expect(firstUseEntry.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'home',
    });
    firstUseEntry.dispose();
    await reopened.owner.close();
  });

  it('rolls back session completion when reward insertion fails, then retries once', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0503-rollback-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'onboarding-rollback.db';
    const opened = await openGraph(driver, databaseName);
    let counter = 0;
    let now = initialNow;
    const id = { nextId: () => `rollback-${++counter}` };
    const clock = { nowMs: () => now };
    expect(await new MigrationRunner({
      owner: opened.owner, transaction: opened.transaction,
      registry: productionMigrationRegistry, clock, id,
    }).migrate()).toMatchObject({ ok: true });
    const coordinator = new SessionCommandCoordinator();
    const start = new StartOnboardingTrialUseCase({
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-08-31', utcOffsetMinutes: 420 },
      }) },
      clock, coordinator, id, sessions: opened.graph.sessions, transaction: opened.transaction,
    });
    const started = await start.execute();
    if (!started.ok) throw new Error('trial did not start');
    const sessionId = started.value.session.id;
    now += 300_000;
    const failing = new CompleteOnboardingTrialUseCase({
      clock, coordinator, id, profile: opened.graph.profile,
      rewards: {
        findBySessionIdInTransaction: (scope, idValue) =>
          opened.graph.rewards.findBySessionIdInTransaction(scope, idValue),
        insertInTransaction: async () => ({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'reward_transactions'),
        }),
      },
      sessions: opened.graph.sessions,
      transaction: opened.transaction,
    });
    expect(await failing.execute(sessionId)).toMatchObject({
      ok: false,
      error: { code: 'SESSION_COMPLETION_WRITE_FAILED' },
    });
    expect(await opened.graph.sessions.findById(sessionId)).toMatchObject({
      ok: true,
      value: { status: 'running', xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null },
    });
    expect(await opened.graph.rewards.findBySessionId(sessionId)).toEqual({ ok: true, value: null });
    expect(await opened.graph.profile.find()).toMatchObject({
      ok: true, value: { totalXp: 0, coinBalance: 0 },
    });

    const retry = new CompleteOnboardingTrialUseCase({
      clock, coordinator, id, profile: opened.graph.profile, rewards: opened.graph.rewards,
      sessions: opened.graph.sessions, transaction: opened.transaction,
    });
    expect(await retry.execute(sessionId)).toMatchObject({
      ok: true, value: { outcome: 'completed_fresh' },
    });
    expect(await opened.graph.profile.find()).toMatchObject({
      ok: true, value: { totalXp: 5, coinBalance: 1 },
    });
    await opened.owner.close();
  });
});
