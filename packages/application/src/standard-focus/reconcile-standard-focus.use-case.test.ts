import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import type { RunningSessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { ReconcileStandardFocusUseCase } from './reconcile-standard-focus.use-case';

const scope: TransactionScope = { transactionId: Symbol('strict-reconcile') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const strict = (change: Partial<RunningSessionRecord> = {}): RunningSessionRecord => ({
  id: 'strict-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'strict', status: 'running', workTag: 'coding', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000, ...change,
});

const create = (record: RunningSessionRecord, now: number) => {
  const clear = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
  const transition = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
  const useCase = new ReconcileStandardFocusUseCase({
    clock: { nowMs: () => now },
    coordinator: new SessionCommandCoordinator(),
    sessions: {
      findActiveInTransaction: async () => ({ ok: true, value: record }),
      findByIdInTransaction: async () => ({ ok: true, value: record }),
      clearBackgroundedAtInTransaction: clear,
      transitionFromRunningInTransaction: transition,
    },
    transaction,
  });
  return { clear, transition, useCase };
};

describe('ReconcileStandardFocusUseCase', () => {
  it('clears the exact safe episode before grace', async () => {
    const { clear, transition, useCase } = create(
      strict({ backgroundedAt: 11_000, updatedAt: 11_000 }),
      20_999,
    );
    expect(await useCase.execute()).toEqual({
      ok: true,
      value: { outcome: 'safe_episode_cleared', sessionId: 'strict-1' },
    });
    expect(clear).toHaveBeenCalledWith(scope, {
      sessionId: 'strict-1', expectedBackgroundedAt: 11_000, updatedAt: 20_999,
    });
    expect(transition).not.toHaveBeenCalled();
  });

  it('commits failed at the exact grace/deadline equality with zero reward', async () => {
    const record = strict({ endsAt: 21_000, backgroundedAt: 11_000, updatedAt: 11_000 });
    const { transition, useCase } = create(record, 21_000);
    expect(await useCase.execute()).toEqual({
      ok: true,
      value: {
        outcome: 'failed', sessionId: 'strict-1', freshness: 'fresh_commit', resolvedAt: 21_000,
      },
    });
    expect(transition).toHaveBeenCalledWith(scope, {
      sessionId: 'strict-1', status: 'failed', resolvedAt: 21_000,
      xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null, updatedAt: 21_000,
    });
  });

  it.each([
    [strict({ endsAt: 20_000, backgroundedAt: 11_000 }), 20_000],
    [strict({ endsAt: 20_000, backgroundedAt: null }), 20_000],
  ])('delegates completion without writing terminal truth', async (record, now) => {
    const { clear, transition, useCase } = create(record, now);
    expect(await useCase.execute()).toEqual({
      ok: true, value: { outcome: 'completion_due', sessionId: 'strict-1' },
    });
    expect(clear).not.toHaveBeenCalled();
    expect(transition).not.toHaveBeenCalled();
  });
});
