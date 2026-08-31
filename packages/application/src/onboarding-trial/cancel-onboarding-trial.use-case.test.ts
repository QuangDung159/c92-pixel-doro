import { describe, expect, it, vi } from 'vitest';

import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { CancelOnboardingTrialUseCase } from './cancel-onboarding-trial.use-case';
import { createOnboardingTrialRecord } from './onboarding-trial-record';
import { SessionCommandCoordinator } from './session-command.coordinator';

const scope: TransactionScope = { transactionId: Symbol('test') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const trial = (): RunningSessionRecord => {
  const result = createOnboardingTrialRecord({
    id: 'trial-1',
    startedAt: 1_000,
    scheduledEndLocalDate: '2026-08-31',
    scheduledEndUtcOffsetMinutes: 420,
  });
  if (!result.ok) throw new Error('fixture');
  return result.value;
};

describe('CancelOnboardingTrialUseCase', () => {
  it('conditionally commits cancelled with zero reward', async () => {
    const transition = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
    const useCase = new CancelOnboardingTrialUseCase({
      clock: { nowMs: () => 2_000 },
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: trial() }),
        transitionFromRunningInTransaction: transition,
      },
      transaction,
    });

    expect(await useCase.execute('trial-1')).toEqual({
      ok: true,
      value: { outcome: 'cancelled', sessionId: 'trial-1' },
    });
    expect(transition).toHaveBeenCalledWith(scope, {
      sessionId: 'trial-1',
      status: 'cancelled',
      resolvedAt: 2_000,
      xpEarned: 0,
      coinsEarned: 0,
      rewardClaimedAt: null,
      updatedAt: 2_000,
    });
  });

  it('refuses cancellation at the deadline', async () => {
    const transition = vi.fn();
    const useCase = new CancelOnboardingTrialUseCase({
      clock: { nowMs: () => 301_000 },
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: trial() }),
        transitionFromRunningInTransaction: transition,
      },
      transaction,
    });

    expect(await useCase.execute('trial-1')).toEqual({
      ok: false,
      error: { kind: 'cancel_onboarding_trial_error', code: 'SESSION_DEADLINE_REACHED' },
    });
    expect(transition).not.toHaveBeenCalled();
  });

  it('treats an already-cancelled session as idempotent success', async () => {
    const cancelled = {
      ...trial(),
      status: 'cancelled',
      resolvedAt: 2_000,
    } as SessionRecord;
    const useCase = new CancelOnboardingTrialUseCase({
      clock: { nowMs: () => 3_000 },
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: cancelled }),
        transitionFromRunningInTransaction: vi.fn(),
      },
      transaction,
    });

    expect(await useCase.execute('trial-1')).toEqual({
      ok: true,
      value: { outcome: 'already_cancelled', sessionId: 'trial-1' },
    });
  });
});
