import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  LoadBreakSessionUseCase,
  LoadNextBreakRecommendationUseCase,
  ReconcileBreakUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartBreakUseCase,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';
import { createBreakRunningReviewFixture } from '../../src/composition/review/break-running-review-fixture';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('US-07-03 durable Break completion integration', () => {
  it('seeds a real relaunch fixture and keeps wall-clock continuity across reopen', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0703-fixture-'));
    directories.push(directory);
    const driver = new HostDriver(directory);
    const database = await openDatabase(driver, 'break-relaunch-fixture.db');
    let wallNow = now;
    const baseClock = { nowMs: () => wallNow };
    const first = createBreakRunningReviewFixture(
      'break_running_relaunch_before_deadline', baseClock, database.graph.sessions,
    );
    if (first === undefined) throw new Error('fixture_missing');
    await first.prepare({
      installation: database.graph.installation,
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
      longBreakCadence: database.graph.longBreakCadence,
    });
    expect(await database.graph.sessions.findActive()).toMatchObject({ ok: true, value: {
      id: first.breakSessionId, sessionType: 'short_break', status: 'running',
      startedAt: wallNow, endsAt: wallNow + 300_000,
    } });

    wallNow += 10_000;
    const reopened = createBreakRunningReviewFixture(
      'break_running_relaunch_before_deadline', baseClock, database.graph.sessions,
    );
    if (reopened === undefined) throw new Error('fixture_missing');
    await reopened.prepare({
      installation: database.graph.installation,
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
      longBreakCadence: database.graph.longBreakCadence,
    });
    expect(reopened.clock.nowMs()).toBe(wallNow);
    expect(reopened.breakSessionId).toBe(first.breakSessionId);

    const accelerated = createBreakRunningReviewFixture(
      'break_running_short_fast_clock', baseClock, database.graph.sessions,
    );
    if (accelerated === undefined || accelerated.scheduler === undefined) {
      throw new Error('fixture_missing');
    }
    expect(accelerated.clock.nowMs()).toBe(wallNow);
    expect(await new ReconcileBreakUseCase({
      clock: accelerated.clock,
      coordinator: new SessionCommandCoordinator(),
      sessions: accelerated.sessions,
      transaction: database.transaction,
    }).execute(accelerated.breakSessionId)).toMatchObject({
      ok: true, value: { outcome: 'running', sessionId: accelerated.breakSessionId },
    });
    await accelerated.prepare({
      installation: database.graph.installation,
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
      longBreakCadence: database.graph.longBreakCadence,
    });
    const acceleratedBeforeTick = accelerated.clock.nowMs();
    await new Promise<void>((resolve) => accelerated.scheduler!.schedule(resolve, 1_000));
    expect(accelerated.clock.nowMs() - acceleratedBeforeTick).toBe(60_000);
    await database.owner.close();
  });

  it.each([
    [1, 'short', 5, 1],
    [4, 'long', 15, 0],
  ] as const)('completes %s-focus cadence as %s Break with zero reward', async (
    focusCount, kind, durationMinutes, countAfter,
  ) => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0703-'));
    directories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = `break-complete-${focusCount}.db`;
    let database = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    let time = now;
    let sequence = 0;
    const clock = { nowMs: () => time };
    const id = { nextId: () => `us0703-${++sequence}` };
    const calendar = { snapshot: () => ({ ok: true as const,
      value: { localDate: '2026-09-09', utcOffsetMinutes: 420 } }) };

    let sourceId = '';
    for (let index = 0; index < focusCount; index += 1) {
      const started = await new StartStandardFocusUseCase({
        calendar, clock, coordinator, id, sessions: database.graph.sessions,
        transaction: database.transaction,
      }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
      if (!started.ok) throw new Error('focus_start_failed');
      sourceId = started.value.session.id;
      time = started.value.session.endsAt;
      expect(await new ReconcileStandardFocusUseCase({
        clock, coordinator, id, profile: database.graph.profile,
        rewards: database.graph.rewards, sessions: database.graph.sessions,
        transaction: database.transaction,
      }).execute(sourceId)).toMatchObject({ ok: true, value: { outcome: 'completed' } });
      time += 1_000;
    }

    const profileBefore = await database.graph.profile.find();
    const started = await new StartBreakUseCase({
      calendar, clock, coordinator, id, longBreakCadence: database.graph.longBreakCadence,
      sessions: database.graph.sessions, transaction: database.transaction,
    }).execute({ sourceFocusSessionId: sourceId });
    if (!started.ok) throw new Error('break_start_failed');
    const breakId = started.value.session.id;
    time = started.value.session.endsAt;
    const reconcile = new ReconcileBreakUseCase({
      clock, coordinator, sessions: database.graph.sessions,
      transaction: database.transaction,
    });
    const [first, duplicate] = await Promise.all([
      reconcile.execute(breakId), reconcile.execute(breakId),
    ]);
    expect(first).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'fresh_commit', sessionId: breakId,
    } });
    expect(duplicate).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'existing_terminal', sessionId: breakId,
    } });
    expect(await database.graph.rewards.findBySessionId(breakId)).toEqual({ ok: true, value: null });
    expect(await database.graph.profile.find()).toEqual(profileBefore);

    const recommendation = await new LoadNextBreakRecommendationUseCase({
      sessions: database.graph.sessions, longBreakCadence: database.graph.longBreakCadence,
    }).execute(sourceId);
    expect(recommendation).toMatchObject({ ok: true, value: {
      completedStandardFocusCountSinceLastCompletedLongBreak: countAfter,
      recommendation: { kind: 'short' },
    } });

    await database.owner.close();
    database = await openDatabase(driver, databaseName);
    expect(await new LoadBreakSessionUseCase(database.graph.sessions).execute(breakId))
      .toMatchObject({ ok: true, value: {
        status: 'completed', sessionId: breakId, kind, durationMinutes,
      } });
    const row = await database.graph.sessions.findById(breakId);
    expect(row).toMatchObject({ ok: true, value: {
      status: 'completed', backgroundedAt: null, xpEarned: 0, coinsEarned: 0,
      rewardClaimedAt: null, resolvedAt: time, updatedAt: time,
    } });
    await database.owner.close();
  });
});
