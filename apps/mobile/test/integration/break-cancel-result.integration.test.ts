import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CancelBreakUseCase,
  LoadBreakSessionUseCase,
  LoadNextBreakRecommendationUseCase,
  ReconcileBreakUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartBreakUseCase,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((directory) =>
  rm(directory, { recursive: true, force: true }))));

const createHarness = async (focusCount: number) => {
  const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0704-'));
  directories.push(directory);
  const driver = new HostDriver(directory);
  const databaseName = `break-cancel-${focusCount}.db`;
  let database = await openDatabase(driver, databaseName);
  const coordinator = new SessionCommandCoordinator();
  let time = now;
  let sequence = 0;
  const clock = { nowMs: () => time };
  const id = { nextId: () => `us0704-${++sequence}` };
  const calendar = { snapshot: () => ({ ok: true as const,
    value: { localDate: '2026-09-10', utcOffsetMinutes: 420 } }) };
  let sourceFocusSessionId = '';
  for (let index = 0; index < focusCount; index += 1) {
    const focus = await new StartStandardFocusUseCase({
      calendar, clock, coordinator, id, sessions: database.graph.sessions,
      transaction: database.transaction,
    }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
    if (!focus.ok) throw new Error('focus_start_failed');
    sourceFocusSessionId = focus.value.session.id;
    time = focus.value.session.endsAt;
    const completed = await new ReconcileStandardFocusUseCase({
      clock, coordinator, id, profile: database.graph.profile,
      rewards: database.graph.rewards, sessions: database.graph.sessions,
      transaction: database.transaction,
    }).execute(sourceFocusSessionId);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error('focus_completion_failed');
    }
    time += 1_000;
  }
  const started = await new StartBreakUseCase({
    calendar, clock, coordinator, id, longBreakCadence: database.graph.longBreakCadence,
    sessions: database.graph.sessions, transaction: database.transaction,
  }).execute({ sourceFocusSessionId });
  if (!started.ok) throw new Error('break_start_failed');
  return {
    get database() { return database; }, databaseName, driver, coordinator, clock,
    sourceFocusSessionId, breakSessionId: started.value.session.id,
    endsAt: started.value.session.endsAt,
    setTime: (value: number) => { time = value; },
    reopen: async () => {
      await database.owner.close();
      database = await openDatabase(driver, databaseName);
    },
  };
};

describe('US-07-04 durable Break cancel and Result integration', () => {
  it.each([[1, 'short', 1], [4, 'long', 4]] as const)(
    'cancels after %s Focus as %s Break and preserves cadence %s',
    async (focusCount, kind, cadenceCount) => {
      const h = await createHarness(focusCount);
      const profileBefore = await h.database.graph.profile.find();
      h.setTime(h.endsAt - 1_000);
      const cancel = new CancelBreakUseCase({
        clock: h.clock, coordinator: h.coordinator, sessions: h.database.graph.sessions,
        transaction: h.database.transaction,
      });
      expect(await cancel.execute(h.breakSessionId)).toMatchObject({ ok: true, value: {
        outcome: 'cancelled', freshness: 'fresh_commit', resolvedAt: h.endsAt - 1_000,
      } });
      expect(await cancel.execute(h.breakSessionId)).toMatchObject({ ok: true, value: {
        outcome: 'cancelled', freshness: 'existing_terminal',
      } });
      expect(await new ReconcileBreakUseCase({
        clock: h.clock, coordinator: h.coordinator, sessions: h.database.graph.sessions,
        transaction: h.database.transaction,
      }).execute(h.breakSessionId)).toMatchObject({ ok: true, value: {
        outcome: 'terminal_winner', sessionId: h.breakSessionId,
      } });
      expect(await h.database.graph.rewards.findBySessionId(h.breakSessionId))
        .toEqual({ ok: true, value: null });
      expect(await h.database.graph.profile.find()).toEqual(profileBefore);
      expect(await new LoadNextBreakRecommendationUseCase({
        sessions: h.database.graph.sessions,
        longBreakCadence: h.database.graph.longBreakCadence,
      }).execute(h.sourceFocusSessionId)).toMatchObject({ ok: true, value: {
        completedStandardFocusCountSinceLastCompletedLongBreak: cadenceCount,
        recommendation: { kind },
      } });
      await h.reopen();
      expect(await new LoadBreakSessionUseCase(h.database.graph.sessions)
        .execute(h.breakSessionId)).toMatchObject({ ok: true, value: {
          status: 'cancelled', sessionId: h.breakSessionId, kind,
        } });
      await h.database.owner.close();
    },
  );

  it('resolves confirm at deadline as completion and keeps the winner immutable', async () => {
    const h = await createHarness(1);
    h.setTime(h.endsAt);
    const cancel = new CancelBreakUseCase({
      clock: h.clock, coordinator: h.coordinator, sessions: h.database.graph.sessions,
      transaction: h.database.transaction,
    });
    const reconcile = new ReconcileBreakUseCase({
      clock: h.clock, coordinator: h.coordinator, sessions: h.database.graph.sessions,
      transaction: h.database.transaction,
    });
    const [cancelResult, reconcileResult] = await Promise.all([
      cancel.execute(h.breakSessionId), reconcile.execute(h.breakSessionId),
    ]);
    expect(cancelResult).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'fresh_commit',
    } });
    expect(reconcileResult).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'existing_terminal',
    } });
    expect(await h.database.graph.sessions.findById(h.breakSessionId)).toMatchObject({
      ok: true, value: { status: 'completed', xpEarned: 0, coinsEarned: 0,
        rewardClaimedAt: null, backgroundedAt: null },
    });
    await h.database.owner.close();
  });
});
