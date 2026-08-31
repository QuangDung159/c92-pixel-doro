import { describe, expect, it } from 'vitest';

import {
  createOnboardingTrialRecord,
  ONBOARDING_TRIAL_DURATION_MS,
} from './onboarding-trial-record';

describe('createOnboardingTrialRecord', () => {
  it('creates the immutable five-minute Relax trial shape', () => {
    const result = createOnboardingTrialRecord({
      id: 'trial-1',
      startedAt: 1_000,
      scheduledEndLocalDate: '2026-08-31',
      scheduledEndUtcOffsetMinutes: 420,
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: 'trial-1',
        profileId: 1,
        sessionType: 'focus',
        focusVariant: 'onboarding_trial',
        mode: 'relax',
        status: 'running',
        workTag: null,
        configuredDurationMinutes: 5,
        startedAt: 1_000,
        endsAt: 1_000 + ONBOARDING_TRIAL_DURATION_MS,
        backgroundedAt: null,
        resolvedAt: null,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
      }),
    });
  });

  it.each([
    { id: '', startedAt: 1_000, scheduledEndLocalDate: '2026-08-31', scheduledEndUtcOffsetMinutes: 420 },
    { id: 'x', startedAt: -1, scheduledEndLocalDate: '2026-08-31', scheduledEndUtcOffsetMinutes: 420 },
    { id: 'x', startedAt: 1_000, scheduledEndLocalDate: '31-08-2026', scheduledEndUtcOffsetMinutes: 420 },
    { id: 'x', startedAt: 1_000, scheduledEndLocalDate: '2026-02-30', scheduledEndUtcOffsetMinutes: 420 },
    { id: 'x', startedAt: 1_000, scheduledEndLocalDate: '2026-08-31', scheduledEndUtcOffsetMinutes: 841 },
  ])('rejects invalid input %#', (input) => {
    expect(createOnboardingTrialRecord(input)).toEqual({
      ok: false,
      error: {
        kind: 'onboarding_trial_record_error',
        code: 'ONBOARDING_TRIAL_RECORD_INVALID',
      },
    });
  });
});
