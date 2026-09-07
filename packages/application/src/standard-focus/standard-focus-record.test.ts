import { describe, expect, it } from 'vitest';

import { createStandardFocusRecord, isRunningStandardFocus } from './standard-focus-record';

const input = {
  id: 'focus-1',
  configuration: { durationMinutes: 25, mode: 'relax', workTag: 'coding' } as const,
  startedAt: 10_000,
  scheduledEndLocalDate: '2026-09-03',
  scheduledEndUtcOffsetMinutes: 420,
};

describe('createStandardFocusRecord', () => {
  it('creates the exact immutable running Standard Focus shape', () => {
    const result = createStandardFocusRecord(input);

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'focus-1',
        profileId: 1,
        sessionType: 'focus',
        focusVariant: 'standard',
        mode: 'relax',
        status: 'running',
        workTag: 'coding',
        configuredDurationMinutes: 25,
        startedAt: 10_000,
        endsAt: 1_510_000,
        backgroundedAt: null,
        resolvedAt: null,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        scheduledEndLocalDate: '2026-09-03',
        scheduledEndUtcOffsetMinutes: 420,
        createdAt: 10_000,
        updatedAt: 10_000,
      },
    });
    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
    expect(result.ok && isRunningStandardFocus(result.value)).toBe(true);
  });

  it.each([
    { ...input, id: '' },
    { ...input, startedAt: -1 },
    { ...input, startedAt: Number.MAX_SAFE_INTEGER },
    { ...input, scheduledEndLocalDate: '2026-02-30' },
    { ...input, scheduledEndUtcOffsetMinutes: 841 },
    { ...input, configuration: { ...input.configuration, durationMinutes: 17 } },
  ])('rejects invalid record facts', (candidate) => {
    expect(createStandardFocusRecord(candidate)).toEqual({
      ok: false,
      error: {
        kind: 'standard_focus_record_error',
        code: 'STANDARD_FOCUS_RECORD_INVALID',
      },
    });
  });
});
