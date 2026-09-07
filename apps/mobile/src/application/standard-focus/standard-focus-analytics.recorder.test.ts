import { describe, expect, it, vi } from 'vitest';
import type {
  RunningSessionRecord,
  StandardFocusCompletedResult,
} from '@pixeldoro/application';

import { StandardFocusAnalyticsRecorder } from './standard-focus-analytics.recorder';

const running = (): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-07', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

const completed = (): StandardFocusCompletedResult => ({
  sessionId: 'focus-1', durationMinutes: 15, mode: 'relax', workTag: 'study',
  startedAt: 1_000, endsAt: 901_000, resolvedAt: 901_000,
  status: 'completed', receiptId: 'reward-1', rewardClaimedAt: 901_000,
  xpEarned: 15, coinsEarned: 3, totalXp: 20, coinBalance: 4,
});

describe('StandardFocusAnalyticsRecorder', () => {
  it('queues the minimal started event with a deterministic local ID', async () => {
    const enqueueBounded = vi.fn(async (_record: unknown, _nowMs: number) =>
      ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    expect(await recorder.recordStarted(running())).toEqual({
      ok: true,
      value: { outcome: 'recorded', eventIds: ['focus_session_started:focus-1'] },
    });
    expect(enqueueBounded).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'focus_session_started:focus-1',
      eventName: 'focus_session_started',
      occurredAt: 1_000,
      properties: { mode: 'relax', workTag: 'study', durationMinutes: 15 },
    }), 1_000);
  });

  it('queues completed and reward events without session/receipt IDs in properties', async () => {
    const enqueueBounded = vi.fn(async (_record: unknown, _nowMs: number) =>
      ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    expect(await recorder.recordTerminal(completed())).toMatchObject({
      ok: true,
      value: {
        eventIds: ['focus_session_completed:focus-1', 'reward_granted:reward-1'],
      },
    });
    const records = enqueueBounded.mock.calls.map(([record]) => record);
    expect(records).toEqual([
      expect.objectContaining({
        eventName: 'focus_session_completed',
        properties: {
          mode: 'relax', workTag: 'study', durationMinutes: 15,
          terminalStatus: 'completed',
        },
      }),
      expect.objectContaining({
        eventName: 'reward_granted',
        properties: { durationMinutes: 15, xpEarned: 15, coinsEarned: 3 },
      }),
    ]);
  });

  it('respects opt-out without backfill and rejects inconsistent reward facts', async () => {
    const enqueueBounded = vi.fn();
    const recorder = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    expect(await recorder.recordStarted(running())).toEqual({
      ok: true, value: { outcome: 'skipped_disabled' },
    });
    expect(enqueueBounded).not.toHaveBeenCalled();

    const enabled = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    expect(await enabled.recordTerminal({ ...completed(), coinsEarned: 99 })).toMatchObject({
      ok: false,
      error: { code: 'STANDARD_FOCUS_ANALYTICS_FACT_INVALID' },
    });
  });

  it('maps queue rejection to a finite best-effort error', async () => {
    const recorder = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded: vi.fn(async () => { throw new Error('offline'); }) },
    });
    expect(await recorder.recordStarted(running())).toMatchObject({
      ok: false,
      error: { code: 'STANDARD_FOCUS_ANALYTICS_QUEUE_FAILED' },
    });
  });
});
