import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  LoadNextBreakRecommendationUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
  type RunningSessionRecord,
} from '@pixeldoro/application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';
import { createBreakCadenceReviewFixture } from '@/composition/review/break-cadence-review-fixture';

const cleanup: (() => Promise<unknown>)[] = [];

afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

const countRows = async (
  owner: Awaited<ReturnType<typeof openDatabase>>['owner'],
) => owner.withConnection(async (connection) => {
  const row = await connection.getFirstAsync<{
    readonly sessions: number;
    readonly rewards: number;
    readonly totalXp: number;
    readonly coinBalance: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM sessions) AS sessions,
      (SELECT COUNT(*) FROM reward_transactions) AS rewards,
      total_xp AS totalXp,
      coin_balance AS coinBalance
    FROM pet_profiles WHERE id = 1`,
    [],
  );
  if (row === null) throw new Error('break_cadence_fingerprint_missing');
  return row;
});

describe('US-07-01 durable Break cadence Result journey', () => {
  it.each([
    ['break_cadence_count_0', 'short', 0],
    ['break_cadence_count_3', 'short', 3],
    ['break_cadence_count_4', 'long', 4],
    ['break_cadence_due_sticky', 'long', 5],
    ['break_cadence_completed_long_reset', 'short', 0],
    ['break_cadence_cancelled_long_no_reset', 'long', 4],
  ] as const)('prepares isolated production-path fixture %s', async (
    scenario,
    kind,
    count,
  ) => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0701-fixture-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    const database = await openDatabase(driver, `${scenario}.db`);
    cleanup.push(() => database.owner.close());
    const fixture = createBreakCadenceReviewFixture(
      scenario,
      database.graph.longBreakCadence,
    );
    if (fixture === undefined) throw new Error('break_cadence_fixture_missing');

    await fixture.prepare({
      installation: database.graph.installation,
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    });
    const result = await new LoadNextBreakRecommendationUseCase({
      sessions: database.graph.sessions,
      longBreakCadence: fixture.longBreakCadence,
    }).execute(fixture.sourceSessionId);
    expect(result).toMatchObject({
      ok: true,
      value: {
        completedStandardFocusCountSinceLastCompletedLongBreak: count,
        recommendation: { kind },
      },
    });

    const beforeRepeat = await countRows(database.owner);
    await fixture.prepare({
      installation: database.graph.installation,
      profile: database.graph.profile,
      rewards: database.graph.rewards,
      sessions: database.graph.sessions,
      transaction: database.transaction,
    });
    expect(await countRows(database.owner)).toEqual(beforeRepeat);
  });

  it('derives sticky cadence, reset and reopen without recommendation writes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0701-'));
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const driver = new HostDriver(directory);
    let database = await openDatabase(driver, 'break-cadence.db');
    cleanup.push(() => database.owner.close());

    let time = now;
    let nextId = 0;
    const clock = { nowMs: () => time };
    const coordinator = new SessionCommandCoordinator();
    const id = { nextId: () => `us0701-${++nextId}` };
    const calendar = {
      snapshot: () => ({
        ok: true as const,
        value: { localDate: '2026-09-08', utcOffsetMinutes: 420 },
      }),
    };

    const completeStandardFocus = async (): Promise<string> => {
      const start = new StartStandardFocusUseCase({
        calendar,
        clock,
        coordinator,
        id,
        sessions: database.graph.sessions,
        transaction: database.transaction,
      });
      const started = await start.execute({
        durationMinutes: 15,
        mode: 'relax',
        workTag: 'study',
      });
      if (!started.ok) throw new Error('break_cadence_focus_start_failed');
      time = started.value.session.endsAt;
      const reconciled = await new ReconcileStandardFocusUseCase({
        clock,
        coordinator,
        id,
        sessions: database.graph.sessions,
        profile: database.graph.profile,
        rewards: database.graph.rewards,
        transaction: database.transaction,
      }).execute(started.value.session.id);
      expect(reconciled).toMatchObject({
        ok: true,
        value: { outcome: 'completed', freshness: 'fresh_commit' },
      });
      time += 1_000;
      return started.value.session.id;
    };

    const recommendation = () => new LoadNextBreakRecommendationUseCase({
      sessions: database.graph.sessions,
      longBreakCadence: database.graph.longBreakCadence,
    });

    let latestFocusId = '';
    for (let count = 1; count <= 4; count += 1) {
      latestFocusId = await completeStandardFocus();
      expect(await recommendation().execute(latestFocusId)).toMatchObject({
        ok: true,
        value: {
          completedStandardFocusCountSinceLastCompletedLongBreak: count,
          recommendation: {
            kind: count < 4 ? 'short' : 'long',
            durationMinutes: count < 4 ? 5 : 15,
          },
        },
      });
    }

    const seedLongBreak = async (status: 'completed' | 'cancelled') => {
      const startedAt = time;
      const endsAt = startedAt + 15 * 60_000;
      const resolvedAt = status === 'completed' ? endsAt : startedAt + 1_000;
      const record: RunningSessionRecord = {
        id: `long-${status}`,
        profileId: 1,
        sessionType: 'long_break',
        focusVariant: null,
        mode: null,
        status: 'running',
        workTag: null,
        configuredDurationMinutes: 15,
        startedAt,
        endsAt,
        backgroundedAt: null,
        resolvedAt: null,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        scheduledEndLocalDate: '2026-09-08',
        scheduledEndUtcOffsetMinutes: 420,
        createdAt: startedAt,
        updatedAt: startedAt,
      };
      const seeded = await database.transaction.execute(async (scope) => {
        const inserted = await database.graph.sessions.insertRunningInTransaction(
          scope,
          record,
        );
        if (!inserted.ok) return inserted;
        const transitioned = await database.graph.sessions.transitionFromRunningInTransaction(
          scope,
          {
            sessionId: record.id,
            status,
            resolvedAt,
            xpEarned: 0,
            coinsEarned: 0,
            rewardClaimedAt: null,
            updatedAt: resolvedAt,
          },
        );
        if (!transitioned.ok) return transitioned;
        return { ok: true as const, value: undefined };
      });
      expect(seeded).toMatchObject({ ok: true });
      time = resolvedAt + 1_000;
      return resolvedAt;
    };

    await seedLongBreak('cancelled');
    expect(await recommendation().execute(latestFocusId)).toMatchObject({
      ok: true,
      value: { recommendation: { kind: 'long', durationMinutes: 15 } },
    });

    const markerResolvedAt = await seedLongBreak('completed');
    expect(await recommendation().execute(latestFocusId)).toMatchObject({
      ok: true,
      value: {
        completedStandardFocusCountSinceLastCompletedLongBreak: 0,
        latestCompletedLongBreakSessionId: 'long-completed',
        recommendation: { kind: 'short', durationMinutes: 5 },
      },
    });

    await database.owner.withConnection(async (connection) => {
      await connection.runAsync(
        `INSERT INTO sessions (
          id, profile_id, session_type, focus_variant, mode, status, work_tag,
          configured_duration_minutes, started_at, ends_at, backgrounded_at, resolved_at,
          xp_earned, coins_earned, reward_claimed_at, scheduled_end_local_date,
          scheduled_end_utc_offset_minutes, created_at, updated_at
        ) VALUES (?, 1, 'focus', 'standard', 'relax', 'completed', 'coding',
          15, ?, ?, NULL, ?, 15, 3, ?, '2026-09-08', 420, ?, ?)`,
        [
          'equal-timestamp-focus',
          markerResolvedAt - 15 * 60_000,
          markerResolvedAt,
          markerResolvedAt,
          markerResolvedAt,
          markerResolvedAt - 15 * 60_000,
          markerResolvedAt,
        ],
      );
    });
    expect(await recommendation().execute('equal-timestamp-focus')).toMatchObject({
      ok: true,
      value: {
        completedStandardFocusCountSinceLastCompletedLongBreak: 0,
        recommendation: { kind: 'short' },
      },
    });

    const beforeReads = await countRows(database.owner);
    await recommendation().execute(latestFocusId);
    await recommendation().execute(latestFocusId);
    expect(await countRows(database.owner)).toEqual(beforeReads);

    await database.owner.close();
    database = await openDatabase(driver, 'break-cadence.db');
    expect(await recommendation().execute(latestFocusId)).toMatchObject({
      ok: true,
      value: {
        completedStandardFocusCountSinceLastCompletedLongBreak: 0,
        recommendation: { kind: 'short', durationMinutes: 5 },
      },
    });
  });
});
