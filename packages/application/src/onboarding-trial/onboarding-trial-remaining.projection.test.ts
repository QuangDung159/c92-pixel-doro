import { describe, expect, it } from 'vitest';

import { createOnboardingTrialRemainingProjection } from './onboarding-trial-remaining.projection';

describe('createOnboardingTrialRemainingProjection', () => {
  it.each([
    [301_000, 1_000, { phase: 'running', remainingMs: 300_000, displaySeconds: 300 }],
    [301_000, 300_001, { phase: 'running', remainingMs: 999, displaySeconds: 1 }],
    [301_000, 301_000, { phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0 }],
    [301_000, 999_000, { phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0 }],
  ] as const)('derives timestamp truth for endsAt=%i now=%i', (endsAt, now, expected) => {
    expect(createOnboardingTrialRemainingProjection(endsAt, now)).toEqual(expected);
  });
});
