import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LoadDailyContributionUseCase,
  LoadFocusHistoryPageUseCase,
  SessionCommandCoordinator,
} from '@pixeldoro/application';

import { HistoryAnalyticsRecorder } from '@/application';
import {
  createEpic09ExitReviewFixture,
  epic09ExitReviewDatabaseName,
} from '@/composition/review/epic-09-exit-review-fixture';

import { HostDriver, openDatabase } from '../support/standard-focus-sqlite';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

const fixtureDependencies = (
  database: Awaited<ReturnType<typeof openDatabase>>,
) => ({
  coordinator: new SessionCommandCoordinator(),
  installation: database.graph.installation,
  profile: database.graph.profile,
  rewards: database.graph.rewards,
  sessions: database.graph.sessions,
  transaction: database.transaction,
});

const productFingerprint = (
  database: Awaited<ReturnType<typeof openDatabase>>,
) => database.owner.withConnection((connection) => connection.getFirstAsync(
  `SELECT total_xp, coin_balance,
    (SELECT COUNT(*) FROM sessions) AS sessions,
    (SELECT COUNT(*) FROM reward_transactions) AS rewards,
    (SELECT COUNT(*) FROM analytics_events) AS analytics
  FROM pet_profiles WHERE id = 1`,
  [],
));

describe('US-09-05 EPIC-09 SQLite exit integrity', () => {
  it('reconstructs 40 terminal rows, two stable pages and the seven-day graph after reopen', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0905-exit-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    const databaseName = epic09ExitReviewDatabaseName('epic_09_offline_relaunch');
    let database = await openDatabase(driver, databaseName);
    let fixture = createEpic09ExitReviewFixture('epic_09_offline_relaunch', {
      analyticsQueue: database.graph.analyticsQueue,
      contribution: database.graph.contribution,
      history: database.graph.standardFocusHistory,
    });
    if (fixture === undefined) throw new Error('fixture missing');

    expect(await fixture.prepare(fixtureDependencies(database))).toBe(true);
    expect(await fixture.prepare(fixtureDependencies(database))).toBe(false);
    const history = new LoadFocusHistoryPageUseCase({ history: fixture.history });
    const first = await history.execute();
    expect(first).toMatchObject({ ok: true, value: { items: { length: 20 } } });
    if (!first.ok || first.value.nextCursor === null) throw new Error('first page missing');
    const second = await history.execute({ cursor: first.value.nextCursor });
    expect(second).toMatchObject({
      ok: true,
      value: { items: { length: 20 }, nextCursor: null },
    });
    if (!second.ok) throw new Error('second page missing');
    const ids = first.value.items.concat(second.value.items).map((item) => item.id);
    expect(new Set(ids).size).toBe(40);
    expect(new Set(first.value.items.concat(second.value.items).map((item) => item.status)))
      .toEqual(new Set(['completed', 'failed', 'cancelled']));

    const contribution = await new LoadDailyContributionUseCase({
      calendar: fixture.calendar,
      clock: fixture.clock,
      contribution: fixture.contribution,
    }).execute();
    expect(contribution).toMatchObject({ ok: true });
    if (!contribution.ok) throw new Error('contribution missing');
    expect(contribution.value.days.slice(0, 5).map((day) => ({
      date: day.localDate,
      intensity: day.intensity,
      minutes: day.completedMinutes,
    }))).toEqual([
      { date: '2026-09-06', intensity: 'zero', minutes: 0 },
      { date: '2026-09-07', intensity: 'low', minutes: 15 },
      { date: '2026-09-08', intensity: 'medium', minutes: 25 },
      { date: '2026-09-09', intensity: 'high', minutes: 50 },
      { date: '2026-09-10', intensity: 'peak', minutes: 100 },
    ]);
    const beforeReopen = await productFingerprint(database);

    await database.owner.close();
    database = await openDatabase(driver, databaseName);
    cleanup.push(() => database.owner.close());
    fixture = createEpic09ExitReviewFixture('epic_09_offline_relaunch', {
      analyticsQueue: database.graph.analyticsQueue,
      contribution: database.graph.contribution,
      history: database.graph.standardFocusHistory,
    });
    if (fixture === undefined) throw new Error('reopened fixture missing');
    expect(await fixture.prepare(fixtureDependencies(database))).toBe(false);
    expect(await productFingerprint(database)).toEqual(beforeReopen);
    await expect(new LoadFocusHistoryPageUseCase({ history: fixture.history }).execute())
      .resolves.toMatchObject({ ok: true, value: { items: { length: 20 } } });
  });

  it('stores exact deduplicated analytics and leaves product truth unchanged on failure', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0905-analytics-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const database = await openDatabase(new HostDriver(directory), 'analytics.db');
    cleanup.push(() => database.owner.close());
    const normal = createEpic09ExitReviewFixture('epic_09_mixed_40', {
      analyticsQueue: database.graph.analyticsQueue,
      contribution: database.graph.contribution,
      history: database.graph.standardFocusHistory,
    });
    if (normal === undefined) throw new Error('fixture missing');
    await normal.prepare(fixtureDependencies(database));
    const recorder = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: normal.analyticsQueue,
    });
    await expect(recorder.recordViewed('episode-1', normal.clock.nowMs()))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'enqueued' } });
    await expect(recorder.recordViewed('episode-1', normal.clock.nowMs()))
      .resolves.toMatchObject({ ok: true, value: { outcome: 'already_queued' } });
    const queued = await database.graph.analyticsQueue.listDue(normal.clock.nowMs(), 10);
    expect(queued).toMatchObject({ ok: true });
    if (!queued.ok) throw new Error('analytics read failed');
    expect(queued.value).toMatchObject([{
      eventId: 'history_viewed:episode-1',
      eventName: 'history_viewed',
      properties: {},
      occurredAt: normal.clock.nowMs(),
      createdAt: normal.clock.nowMs(),
    }]);

    const beforeFailure = await productFingerprint(database);
    const failing = createEpic09ExitReviewFixture('epic_09_analytics_failure_once', {
      analyticsQueue: database.graph.analyticsQueue,
      contribution: database.graph.contribution,
      history: database.graph.standardFocusHistory,
    });
    if (failing === undefined) throw new Error('failure fixture missing');
    await expect(new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: failing.analyticsQueue,
    }).recordViewed('episode-2', failing.clock.nowMs())).resolves.toMatchObject({
      ok: false,
      error: { code: 'HISTORY_ANALYTICS_QUEUE_FAILED' },
    });
    expect(await productFingerprint(database)).toEqual(beforeFailure);
  });
});
