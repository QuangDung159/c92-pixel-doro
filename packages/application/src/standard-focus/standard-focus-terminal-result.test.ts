import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '../persistence/session.repository';
import type { RewardReceiptRecord } from '../persistence/reward-receipt.repository';
import { projectStandardFocusResult } from './standard-focus-terminal-result';

const session: SessionRecord = {
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'completed', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: 902_000,
  xpEarned: 15, coinsEarned: 3, rewardClaimedAt: 902_000,
  scheduledEndLocalDate: '2026-09-04', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 902_000,
};
const receipt: RewardReceiptRecord = {
  id: 'receipt-1', sessionId: 'focus-1', profileId: 1, reason: 'focus_completed',
  xpDelta: 15, coinDelta: 3, createdAt: 902_000,
};
const profile = { id: 1, totalXp: 50, coinBalance: 1, createdAt: 0, updatedAt: 903_000 };

describe('Standard committed result validation', () => {
  it('projects immutable earned rewards separately from current spendable balance', () => {
    expect(projectStandardFocusResult(session, receipt, profile)).toMatchObject({
      status: 'completed', xpEarned: 15, coinsEarned: 3, totalXp: 50, coinBalance: 1,
    });
  });
  it.each([
    { focusVariant: 'onboarding_trial' }, { sessionType: 'break' }, { status: 'running' },
    { configuredDurationMinutes: 5 }, { endsAt: 900_999 }, { resolvedAt: 900_000 },
    { xpEarned: 16 }, { coinsEarned: 4 }, { rewardClaimedAt: 902_001 },
    { updatedAt: 902_001 }, { profileId: 2 }, { backgroundedAt: 800_000 },
    { mode: 'strict', backgroundedAt: 891_000 },
  ])('rejects corrupt/foreign session %j', (change) => {
    expect(projectStandardFocusResult({ ...session, ...change } as SessionRecord, receipt, profile)).toBeNull();
  });
  it.each([
    null, { id: '' }, { sessionId: 'other' }, { profileId: 2 },
    { reason: 'onboarding_trial_completed' }, { xpDelta: 16 }, { coinDelta: 4 }, { createdAt: 902_001 },
  ])('rejects missing or inconsistent receipt %j', (change) => {
    expect(projectStandardFocusResult(session,
      change === null ? null : { ...receipt, ...change } as RewardReceiptRecord, profile)).toBeNull();
  });
  it.each([{ id: 2 }, { totalXp: -1 }, { coinBalance: -1 }, { totalXp: Infinity }, { coinBalance: 1.5 }])(
    'rejects unsafe profile %j', (change) => {
      expect(projectStandardFocusResult(session, receipt, { ...profile, ...change })).toBeNull();
    },
  );
  it('accepts Strict deadline before grace with evidence preserved', () => {
    expect(projectStandardFocusResult({ ...session, mode: 'strict', backgroundedAt: 895_000 }, receipt, profile))
      .toMatchObject({ status: 'completed', mode: 'strict' });
  });
  it.each(['cancelled', 'failed'] as const)('rejects unexpected receipt for %s', (status) => {
    expect(projectStandardFocusResult({ ...session, status, xpEarned: 0, coinsEarned: 0,
      rewardClaimedAt: null }, receipt, profile)).toBeNull();
  });
});
