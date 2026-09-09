import { describe, expect, it } from 'vitest';

import { createBreakSessionRecord, isRunningBreak } from './break-session-record';

const input = {
  id: 'break-1',
  recommendation: {
    kind: 'short', sessionType: 'short_break', durationMinutes: 5,
  } as const,
  startedAt: 10_000,
  scheduledEndLocalDate: '2026-09-09',
  scheduledEndUtcOffsetMinutes: 420,
};

describe('createBreakSessionRecord', () => {
  it('creates an exact zero-reward running Break record', () => {
    const result = createBreakSessionRecord(input);
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
        mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
        startedAt: 10_000, endsAt: 310_000, backgroundedAt: null, resolvedAt: null,
        xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
        scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
        createdAt: 10_000, updatedAt: 10_000,
      },
    });
    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
    expect(result.ok && isRunningBreak(result.value)).toBe(true);
  });

  it.each([
    { ...input, id: '' },
    { ...input, startedAt: -1 },
    { ...input, scheduledEndLocalDate: '2026-02-30' },
    { ...input, scheduledEndUtcOffsetMinutes: 841 },
    { ...input, recommendation: { kind: 'long', sessionType: 'short_break', durationMinutes: 5 } as never },
  ])('rejects invalid facts', (candidate) => {
    expect(createBreakSessionRecord(candidate)).toMatchObject({
      ok: false,
      error: { code: 'BREAK_SESSION_RECORD_INVALID' },
    });
  });
});
