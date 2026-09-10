import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import type { SessionRecord } from '../persistence/session.repository';
import { persistenceError } from '../persistence/persistence.error';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { ReconcileBreakUseCase } from './reconcile-break.use-case';

const scope: TransactionScope = { transactionId: Symbol('break-reconcile') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const running = (change: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000, ...change,
});

const setup = (initial: SessionRecord | null, now = 301_000) => {
  let row = initial;
  const transition = vi.fn(async (_scope, input) => {
    if (row === null || row.status !== 'running') {
      return { ok: true as const, value: 'not_updated' as const };
    }
    row = { ...row, status: input.status, resolvedAt: input.resolvedAt,
      updatedAt: input.updatedAt, xpEarned: input.xpEarned,
      coinsEarned: input.coinsEarned, rewardClaimedAt: input.rewardClaimedAt };
    return { ok: true as const, value: 'updated' as const };
  });
  const useCase = new ReconcileBreakUseCase({
    clock: { nowMs: () => now },
    coordinator: new SessionCommandCoordinator(),
    sessions: {
      findActiveInTransaction: async () => ({ ok: true, value: row }),
      findByIdInTransaction: async () => ({ ok: true, value: row }),
      transitionFromRunningInTransaction: transition,
    },
    transaction,
  });
  return { getRow: () => row, transition, useCase };
};

describe('ReconcileBreakUseCase', () => {
  it('does not write before deadline', async () => {
    const { transition, useCase } = setup(running(), 300_999);
    expect(await useCase.execute('break-1')).toEqual({
      ok: true, value: { outcome: 'running', sessionId: 'break-1' },
    });
    expect(transition).not.toHaveBeenCalled();
  });

  it('commits completed exactly at deadline with zero reward', async () => {
    const { getRow, transition, useCase } = setup(running());
    expect(await useCase.execute('break-1')).toEqual({ ok: true, value: {
      outcome: 'completed', sessionId: 'break-1', resolvedAt: 301_000,
      freshness: 'fresh_commit',
    } });
    expect(transition).toHaveBeenCalledWith(scope, {
      sessionId: 'break-1', status: 'completed', resolvedAt: 301_000,
      updatedAt: 301_000, xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
    });
    expect(getRow()).toMatchObject({ status: 'completed', xpEarned: 0, coinsEarned: 0,
      rewardClaimedAt: null, backgroundedAt: null });
  });

  it('returns existing completed without another transition', async () => {
    const completed = running({ status: 'completed', resolvedAt: 302_000, updatedAt: 302_000 });
    const { transition, useCase } = setup(completed, 400_000);
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'existing_terminal', resolvedAt: 302_000,
    } });
    expect(transition).not.toHaveBeenCalled();
  });

  it('does not own a Focus found during active startup arbitration', async () => {
    const focus = running({ sessionType: 'focus', focusVariant: 'standard', mode: 'relax',
      workTag: 'coding' });
    const { useCase } = setup(focus, 2_000);
    expect(await useCase.execute()).toEqual({ ok: true, value: { outcome: 'not_owned' } });
    expect(await useCase.execute('break-1')).toMatchObject({
      ok: false, error: { code: 'BREAK_RECONCILE_STATE_INVALID' },
    });
  });

  it('maps repository read and transition failures', async () => {
    const read = new ReconcileBreakUseCase({
      clock: { nowMs: () => 301_000 }, coordinator: new SessionCommandCoordinator(), transaction,
      sessions: {
        findActiveInTransaction: async () => ({ ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions') }),
        findByIdInTransaction: async () => ({ ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions') }),
        transitionFromRunningInTransaction: vi.fn(),
      },
    });
    expect(await read.execute()).toMatchObject({
      ok: false, error: { code: 'BREAK_RECONCILE_READ_FAILED' },
    });

    const broken = new ReconcileBreakUseCase({
      clock: { nowMs: () => 301_000 }, coordinator: new SessionCommandCoordinator(), transaction,
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: running() }),
        findByIdInTransaction: async () => ({ ok: true, value: running() }),
        transitionFromRunningInTransaction: async () => ({ ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions') }),
      },
    });
    expect(await broken.execute('break-1')).toMatchObject({
      ok: false, error: { code: 'BREAK_RECONCILE_WRITE_FAILED' },
    });
  });
});
