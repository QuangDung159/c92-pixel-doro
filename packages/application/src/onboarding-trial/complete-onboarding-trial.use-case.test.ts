import { describe, expect, it, vi } from 'vitest';

import type { ProfileRecord } from '../persistence/profile.repository';
import type { RewardReceiptRecord } from '../persistence/reward-receipt.repository';
import type { SessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { CompleteOnboardingTrialUseCase } from './complete-onboarding-trial.use-case';
import { SessionCommandCoordinator } from './session-command.coordinator';

const running = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 'trial-1',
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'onboarding_trial',
  mode: 'relax',
  status: 'running',
  workTag: null,
  configuredDurationMinutes: 5,
  startedAt: 1_000,
  endsAt: 301_000,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-08-31',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000,
  updatedAt: 1_000,
  ...overrides,
});

const profile = (overrides: Partial<ProfileRecord> = {}): ProfileRecord => ({
  id: 1,
  totalXp: 0,
  coinBalance: 0,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const transaction: TransactionPort = {
  execute: async (work) => work({ transactionId: Symbol('test') }),
};

const setup = (session: SessionRecord, now = 301_000) => {
  let current = session;
  let currentProfile = profile();
  let receipt: RewardReceiptRecord | null = null;
  const transition = vi.fn(async (_scope: TransactionScope, input) => {
    if (current.status !== 'running') return { ok: true as const, value: 'not_updated' as const };
    current = { ...current, ...input };
    return { ok: true as const, value: 'updated' as const };
  });
  const insert = vi.fn(async (_scope: TransactionScope, record: RewardReceiptRecord) => {
    receipt = record;
    return { ok: true as const, value: undefined };
  });
  const progress = vi.fn(async () => {
    currentProfile = { ...currentProfile, totalXp: 5, coinBalance: 1, updatedAt: now };
    return { ok: true as const, value: 'updated' as const };
  });
  const useCase = new CompleteOnboardingTrialUseCase({
    clock: { nowMs: () => now },
    coordinator: new SessionCommandCoordinator(),
    id: { nextId: () => 'receipt-1' },
    profile: {
      findInTransaction: async () => ({ ok: true, value: currentProfile }),
      applyProgressionInTransaction: progress,
    },
    rewards: {
      findBySessionIdInTransaction: async () => ({ ok: true, value: receipt }),
      insertInTransaction: insert,
    },
    sessions: {
      findActiveInTransaction: async () => ({ ok: true, value: current }),
      findByIdInTransaction: async () => ({ ok: true, value: current }),
      transitionFromRunningInTransaction: transition,
    },
    transaction,
  });
  return { useCase, transition, insert, progress, current: () => current };
};

describe('CompleteOnboardingTrialUseCase', () => {
  it('commits exact reward and returns a post-transaction fresh event', async () => {
    const { useCase, transition, insert, progress } = setup(running());

    const result = await useCase.execute('trial-1');

    expect(result).toEqual({
      ok: true,
      value: {
        outcome: 'completed_fresh',
        result: {
          sessionId: 'trial-1',
          receiptId: 'receipt-1',
          resolvedAt: 301_000,
          xpEarned: 5,
          coinsEarned: 1,
          totalXp: 5,
          coinBalance: 1,
        },
        event: {
          eventId: 'receipt-1',
          sessionId: 'trial-1',
          receiptId: 'receipt-1',
          resolvedAt: 301_000,
          xpEarned: 5,
          coinsEarned: 1,
        },
      },
    });
    expect(transition).toHaveBeenCalledBefore(insert);
    expect(insert).toHaveBeenCalledBefore(progress);
  });

  it('does not complete before the durable deadline', async () => {
    const { useCase, transition, insert, progress } = setup(running(), 300_999);

    await expect(useCase.execute()).resolves.toEqual({
      ok: true,
      value: { outcome: 'still_running', sessionId: 'trial-1', endsAt: 301_000 },
    });
    expect(transition).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
  });

  it('hydrates an existing committed result without another event or write', async () => {
    const completed = running({
      status: 'completed',
      resolvedAt: 301_000,
      rewardClaimedAt: 301_000,
      xpEarned: 5,
      coinsEarned: 1,
      updatedAt: 301_000,
    });
    const { useCase, transition, insert, progress } = setup(completed);
    const dependencies = useCase as unknown as {
      dependencies: {
        rewards: { findBySessionIdInTransaction: (scope: TransactionScope) => Promise<unknown> };
        profile: { findInTransaction: (scope: TransactionScope) => Promise<unknown> };
      };
    };
    dependencies.dependencies.rewards.findBySessionIdInTransaction = async () => ({
      ok: true,
      value: {
        id: 'receipt-old', sessionId: 'trial-1', profileId: 1, xpDelta: 5,
        coinDelta: 1, reason: 'onboarding_trial_completed', createdAt: 301_000,
      },
    });
    dependencies.dependencies.profile.findInTransaction = async () => ({
      ok: true,
      value: profile({ totalXp: 5, coinBalance: 1, updatedAt: 301_000 }),
    });

    const result = await useCase.execute('trial-1');

    expect(result.ok && result.value.outcome).toBe('already_completed');
    expect(transition).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
  });

  it('returns cancelled as the terminal winner without reward', async () => {
    const { useCase, insert, progress } = setup(running({ status: 'cancelled', resolvedAt: 10 }));

    await expect(useCase.execute('trial-1')).resolves.toEqual({
      ok: true,
      value: { outcome: 'already_terminal', sessionId: 'trial-1', status: 'cancelled' },
    });
    expect(insert).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
  });

  it('fails safely when reward insertion fails', async () => {
    const { useCase, progress } = setup(running());
    const dependencies = useCase as unknown as {
      dependencies: { rewards: { insertInTransaction: () => Promise<unknown> } };
    };
    dependencies.dependencies.rewards.insertInTransaction = async () => ({
      ok: false,
      error: { kind: 'persistence_error', code: 'PERSISTENCE_WRITE_FAILED', entity: 'reward_transactions' },
    });

    await expect(useCase.execute('trial-1')).resolves.toEqual({
      ok: false,
      error: {
        kind: 'complete_onboarding_trial_error',
        code: 'SESSION_COMPLETION_WRITE_FAILED',
      },
    });
    expect(progress).not.toHaveBeenCalled();
  });
});
