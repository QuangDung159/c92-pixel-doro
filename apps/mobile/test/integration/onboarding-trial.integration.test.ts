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
  OnboardingAnalyticsRecorder,
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
  it('keeps committed Start and Continue successful when analytics throws', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0505-best-effort-'));
    temporaryDirectories.push(directory);
    let counter = 0;
    let now = initialNow;
    const recordStarted = vi.fn(() => {
      throw new Error('analytics unavailable');
    });
    const recordCompleted = vi.fn(() => {
      throw new Error('analytics unavailable');
    });
    const application = createMobileApplication({
      appLifecycle: {
        getCurrentState: () => 'active',
        subscribe: () => vi.fn(),
      },
      clock: { nowMs: () => now },
      id: { nextId: () => `best-effort-${++counter}` },
      localCalendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-01', utcOffsetMinutes: 420 },
      }) },
      onboardingAnalytics: { recordStarted, recordCompleted },
      sqliteDriver: new HostDriver(directory),
      databaseName: 'best-effort.db',
    });

    await application.boot();
    const started = await application.startOnboardingTrial();
    expect(started).toMatchObject({ ok: true, value: { outcome: 'started' } });
    if (!started.ok) throw new Error('trial did not start');
    expect(recordStarted).toHaveBeenCalledWith(
      started.value.session.id,
      started.value.session.startedAt,
    );

    now += 300_000;
    expect(await application.reconcileOnboardingTrial(started.value.session.id))
      .toMatchObject({ ok: true, value: { outcome: 'completed_fresh' } });
    await application.refreshOnboardingTrialResult();
    const result = application.onboardingTrialResult.getSnapshot();
    if (result.status !== 'ready') throw new Error('trial result was not ready');
    now += 1_000;
    expect(await application.completeFirstUseHandoff(result.result)).toMatchObject({
      ok: true,
      value: { outcome: 'completed_fresh', completedAt: now },
    });
    expect(recordCompleted).toHaveBeenCalledWith(now);
    expect(await application.persistence.profile.find()).toMatchObject({
      ok: true,
      value: { totalXp: 5, coinBalance: 1 },
    });
    await application.dispose();
  });

  it('proves the production Epic journey, analytics idempotency, and every standard exclusion', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0505-exit-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'epic-05-exit.db';
    const opened = await openGraph(driver, databaseName);
    let counter = 0;
    let now = initialNow;
    const id = { nextId: () => `us0505-${++counter}` };
    const clock = { nowMs: () => now };
    expect(await new MigrationRunner({
      owner: opened.owner,
      transaction: opened.transaction,
      registry: productionMigrationRegistry,
      clock,
      id,
    }).migrate()).toMatchObject({ ok: true });

    const coordinator = new SessionCommandCoordinator();
    const start = new StartOnboardingTrialUseCase({
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-01', utcOffsetMinutes: 420 },
      }) },
      clock,
      coordinator,
      id,
      sessions: opened.graph.sessions,
      transaction: opened.transaction,
    });
    const analytics = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: opened.graph.analyticsQueue,
    });
    const started = await start.execute();
    if (!started.ok) throw new Error('trial did not start');
    const sessionId = started.value.session.id;
    const startedEventId = `onboarding_started:${sessionId}`;
    expect(await analytics.recordStarted(sessionId, started.value.session.startedAt))
      .toMatchObject({ ok: true, value: { outcome: 'enqueued', eventId: startedEventId } });
    expect(await analytics.recordStarted(sessionId, started.value.session.startedAt))
      .toMatchObject({ ok: true, value: { outcome: 'already_queued' } });

    now += 300_000;
    const complete = new CompleteOnboardingTrialUseCase({
      clock,
      coordinator,
      id,
      profile: opened.graph.profile,
      rewards: opened.graph.rewards,
      sessions: opened.graph.sessions,
      transaction: opened.transaction,
    });
    expect(await complete.execute(sessionId)).toMatchObject({
      ok: true,
      value: { outcome: 'completed_fresh' },
    });
    expect(await complete.execute(sessionId)).toMatchObject({
      ok: true,
      value: { outcome: 'already_completed' },
    });

    now += 1_000;
    const handoff = new CompleteFirstUseHandoffUseCase({
      clock,
      installation: opened.graph.installation,
    });
    const completed = await handoff.execute();
    expect(completed).toEqual({
      ok: true,
      value: { outcome: 'completed_fresh', completedAt: now },
    });
    if (!completed.ok) throw new Error('handoff did not complete');
    const completedEventId = `onboarding_completed:1:${completed.value.completedAt}`;
    expect(await analytics.recordCompleted(completed.value.completedAt)).toMatchObject({
      ok: true,
      value: { outcome: 'enqueued', eventId: completedEventId },
    });
    expect(await analytics.recordCompleted(completed.value.completedAt)).toMatchObject({
      ok: true,
      value: { outcome: 'already_queued' },
    });
    now += 1_000;
    expect(await handoff.execute()).toEqual({
      ok: true,
      value: { outcome: 'already_completed', completedAt: now - 1_000 },
    });

    const assertExitFacts = async (
      database: Awaited<ReturnType<typeof openGraph>>,
    ): Promise<void> => {
      expect(await database.graph.sessions.findById(sessionId)).toMatchObject({
        ok: true,
        value: {
          focusVariant: 'onboarding_trial',
          status: 'completed',
          xpEarned: 5,
          coinsEarned: 1,
        },
      });
      expect(await database.graph.rewards.findBySessionId(sessionId)).toMatchObject({
        ok: true,
        value: { xpDelta: 5, coinDelta: 1 },
      });
      expect(await database.graph.profile.find()).toMatchObject({
        ok: true,
        value: { totalXp: 5, coinBalance: 1 },
      });
      expect(await database.graph.installation.find()).toMatchObject({
        ok: true,
        value: { onboardingCompletedAt: completed.value.completedAt },
      });
      expect(await database.graph.analyticsEvents.findById(startedEventId)).toMatchObject({
        ok: true,
        value: { eventName: 'onboarding_started', properties: {} },
      });
      expect(await database.graph.analyticsEvents.findById(completedEventId)).toMatchObject({
        ok: true,
        value: { eventName: 'onboarding_completed', properties: {} },
      });
      expect(await database.graph.standardFocusHistory.list({
        profileId: 1,
        limit: 10,
        cursor: null,
      })).toEqual({ ok: true, value: { entries: [], nextCursor: null } });
      expect(await database.graph.contribution.listRange({
        profileId: 1,
        startLocalDate: '2026-09-01',
        endLocalDate: '2026-09-01',
      })).toEqual({ ok: true, value: [] });
      expect(await database.graph.longBreakCadence.getFacts(1)).toEqual({
        ok: true,
        value: {
          profileId: 1,
          completedStandardFocusCountSinceLastCompletedLongBreak: 0,
          latestCompletedLongBreak: null,
        },
      });
      expect(await database.graph.storeReviewFacts.getFacts({
        profileId: 1,
        appVersion: '0.1.0',
        nowMs: now,
      })).toMatchObject({
        ok: true,
        value: {
          completedStandardFocusCount: 0,
          distinctStandardFocusActiveDayCount: 0,
          latestAttempt: null,
          rolling365DayAttemptCount: 0,
          currentVersionAttempted: false,
        },
      });
      const eventCounts = await database.owner.withConnection((connection) =>
        connection.getAllAsync<{ readonly event_name: string; readonly count: number }>(
          'SELECT event_name, COUNT(*) AS count FROM analytics_events GROUP BY event_name ORDER BY event_name',
          [],
        ));
      expect(eventCounts).toEqual([
        { event_name: 'onboarding_completed', count: 1 },
        { event_name: 'onboarding_started', count: 1 },
      ]);
    };

    await assertExitFacts(opened);
    await opened.owner.close();
    const reopened = await openGraph(driver, databaseName);
    await assertExitFacts(reopened);
    const entry = new FirstUseEntryController({
      installation: reopened.graph.installation,
      sessions: reopened.graph.sessions,
    });
    await entry.refresh();
    expect(entry.getSnapshot()).toEqual({ status: 'ready', destination: 'home' });
    entry.dispose();
    await reopened.owner.close();
  });

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
