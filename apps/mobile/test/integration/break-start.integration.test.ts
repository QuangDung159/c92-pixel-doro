import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  LoadNextBreakRecommendationUseCase,
  LoadRunningBreakUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartBreakUseCase,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('US-07-02 durable Start Break integration', () => {
  it.each([
    [1, 'short_break', 5],
    [4, 'long_break', 15],
  ] as const)('commits count %s as exact %s and survives reopen', async (
    focusCount,
    sessionType,
    durationMinutes,
  ) => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0702-'));
    directories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = `break-start-${focusCount}.db`;
    let database = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    let time = now;
    let sequence = 0;
    const clock = { nowMs: () => time };
    const id = { nextId: () => `us0702-${++sequence}` };
    const calendar = { snapshot: () => ({
      ok: true as const,
      value: { localDate: '2026-09-09', utcOffsetMinutes: 420 },
    }) };

    let sourceId = '';
    let stalePreviewSourceId: string | null = null;
    for (let index = 0; index < focusCount; index += 1) {
      const started = await new StartStandardFocusUseCase({
        calendar, clock, coordinator, id,
        sessions: database.graph.sessions,
        transaction: database.transaction,
      }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
      if (!started.ok) throw new Error('focus_start_failed');
      sourceId = started.value.session.id;
      time = started.value.session.endsAt;
      const completed = await new ReconcileStandardFocusUseCase({
        clock, coordinator, id,
        profile: database.graph.profile,
        rewards: database.graph.rewards,
        sessions: database.graph.sessions,
        transaction: database.transaction,
      }).execute(sourceId);
      expect(completed).toMatchObject({ ok: true, value: { outcome: 'completed' } });
      time += 1_000;
      if (focusCount === 4 && index === 2) {
        stalePreviewSourceId = sourceId;
        expect(await new LoadNextBreakRecommendationUseCase({
          sessions: database.graph.sessions,
          longBreakCadence: database.graph.longBreakCadence,
        }).execute(sourceId)).toMatchObject({
          ok: true, value: { recommendation: { kind: 'short', durationMinutes: 5 } },
        });
      }
    }

    const profileBefore = await database.graph.profile.find();
    const startBreak = new StartBreakUseCase({
      calendar, clock, coordinator, id,
      longBreakCadence: database.graph.longBreakCadence,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    });
    const [first, duplicate] = await Promise.all([
      startBreak.execute({ sourceFocusSessionId: stalePreviewSourceId ?? sourceId }),
      startBreak.execute({ sourceFocusSessionId: stalePreviewSourceId ?? sourceId }),
    ]);
    expect(first).toMatchObject({
      ok: true,
      value: { session: { sessionType, configuredDurationMinutes: durationMinutes } },
    });
    expect(duplicate).toMatchObject({
      ok: false, error: { code: 'SESSION_START_CONFLICT' },
    });
    if (!first.ok) throw new Error('break_start_failed');
    expect(await database.graph.rewards.findBySessionId(first.value.session.id))
      .toEqual({ ok: true, value: null });
    expect(await database.graph.profile.find()).toEqual(profileBefore);

    await database.owner.close();
    database = await openDatabase(driver, databaseName);
    expect(await new LoadRunningBreakUseCase(database.graph.sessions)
      .execute(first.value.session.id)).toMatchObject({
      ok: true,
      value: { sessionId: first.value.session.id,
        kind: sessionType === 'long_break' ? 'long' : 'short', durationMinutes },
    });
    await database.owner.close();
  });
});
