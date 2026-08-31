import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '../persistence/session.repository';
import { LoadOnboardingTrialResultUseCase } from './load-onboarding-trial-result.use-case';

const completed: SessionRecord = {
  id: 'trial-1', profileId: 1, sessionType: 'focus', focusVariant: 'onboarding_trial',
  mode: 'relax', status: 'completed', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: 301_000,
  xpEarned: 5, coinsEarned: 1, rewardClaimedAt: 301_000,
  scheduledEndLocalDate: '2026-08-31', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 301_000,
};

describe('LoadOnboardingTrialResultUseCase', () => {
  it('projects only matching committed facts', async () => {
    const useCase = new LoadOnboardingTrialResultUseCase({
      sessions: { findLatestOnboardingTrial: async () => ({ ok: true, value: completed }) },
      rewards: { findBySessionId: async () => ({
        ok: true,
        value: {
          id: 'receipt-1', sessionId: 'trial-1', profileId: 1, xpDelta: 5,
          coinDelta: 1, reason: 'onboarding_trial_completed', createdAt: 301_000,
        },
      }) },
      profile: { find: async () => ({
        ok: true,
        value: { id: 1, totalXp: 25, coinBalance: 4, createdAt: 0, updatedAt: 301_000 },
      }) },
    });

    await expect(useCase.execute()).resolves.toEqual({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          sessionId: 'trial-1', receiptId: 'receipt-1', resolvedAt: 301_000,
          xpEarned: 5, coinsEarned: 1, totalXp: 25, coinBalance: 4,
        },
      },
    });
  });

  it('rejects mismatched reward facts', async () => {
    const useCase = new LoadOnboardingTrialResultUseCase({
      sessions: { findLatestOnboardingTrial: async () => ({ ok: true, value: completed }) },
      rewards: { findBySessionId: async () => ({
        ok: true,
        value: {
          id: 'receipt-1', sessionId: 'trial-1', profileId: 1, xpDelta: 10,
          coinDelta: 1, reason: 'onboarding_trial_completed', createdAt: 301_000,
        },
      }) },
      profile: { find: async () => ({
        ok: true,
        value: { id: 1, totalXp: 10, coinBalance: 1, createdAt: 0, updatedAt: 0 },
      }) },
    });

    await expect(useCase.execute()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'load_onboarding_trial_result_error',
        code: 'ONBOARDING_TRIAL_RESULT_INCONSISTENT',
      },
    });
  });
});
