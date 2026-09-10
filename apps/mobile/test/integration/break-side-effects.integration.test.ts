import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { BreakAnalyticsRecorder } from '@/application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

const running = (sessionType: 'short_break' | 'long_break'): RunningSessionRecord => ({
  id: `us0705-${sessionType}`, profileId: 1, sessionType, focusVariant: null,
  mode: null, status: 'running', workTag: null,
  configuredDurationMinutes: sessionType === 'short_break' ? 5 : 15,
  startedAt: now, endsAt: now + (sessionType === 'short_break' ? 300_000 : 900_000),
  backgroundedAt: null, resolvedAt: null, xpEarned: 0, coinsEarned: 0,
  rewardClaimedAt: null, scheduledEndLocalDate: '2026-09-10',
  scheduledEndUtcOffsetMinutes: 420, createdAt: now, updatedAt: now,
});

describe('US-07-05 Break side-effect SQLite integration', () => {
  it.each(['short_break', 'long_break'] as const)(
    'persists deterministic fresh-only analytics for %s', async (sessionType) => {
      const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0705-'));
      directories.push(directory);
      const database = await openDatabase(new HostDriver(directory), `${sessionType}.db`);
      const recorder = new BreakAnalyticsRecorder({
        isCaptureEnabled: () => true,
        queue: database.graph.analyticsQueue,
      });
      const session = running(sessionType);
      const kind = sessionType === 'short_break' ? 'short' as const : 'long' as const;
      const durationMinutes = sessionType === 'short_break' ? 5 as const : 15 as const;
      await recorder.recordStarted(session);
      await recorder.recordCompleted({ status: 'completed', sessionId: session.id, kind,
        durationMinutes, startedAt: session.startedAt, endsAt: session.endsAt,
        resolvedAt: session.endsAt });
      expect(await database.graph.analyticsEvents.findById(
        `break_started:${session.id}`,
      )).toMatchObject({ ok: true, value: { eventName: 'break_started', properties: {
        breakType: sessionType, durationMinutes,
      } } });
      expect(await database.graph.analyticsEvents.findById(
        `break_completed:${session.id}`,
      )).toMatchObject({ ok: true, value: { eventName: 'break_completed', properties: {
        breakType: sessionType, durationMinutes, terminalStatus: 'completed',
      } } });
      await recorder.recordStarted(session);
      const due = await database.graph.analyticsQueue.listDue(session.endsAt + 1, 10);
      expect(due).toMatchObject({ ok: true });
      if (due.ok) expect(due.value).toHaveLength(2);
      await database.owner.close();
    },
  );
});
