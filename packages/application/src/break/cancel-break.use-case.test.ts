import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import type { SessionRecord } from '../persistence/session.repository';
import { persistenceError } from '../persistence/persistence.error';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { CancelBreakUseCase } from './cancel-break.use-case';

const scope: TransactionScope = { transactionId: Symbol('cancel-break') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const running = (change: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-10', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000, ...change,
});

const setup = (initial: SessionRecord | null, capturedAt = 2_000) => {
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
  const useCase = new CancelBreakUseCase({
    clock: { nowMs: () => capturedAt }, coordinator: new SessionCommandCoordinator(),
    sessions: { findByIdInTransaction: async () => ({ ok: true, value: row }),
      transitionFromRunningInTransaction: transition }, transaction,
  });
  return { getRow: () => row, transition, useCase };
};

describe('CancelBreakUseCase', () => {
  it('commits cancellation before deadline with zero reward', async () => {
    const { getRow, useCase } = setup(running());
    expect(await useCase.execute('break-1')).toEqual({ ok: true, value: {
      outcome: 'cancelled', sessionId: 'break-1', resolvedAt: 2_000,
      freshness: 'fresh_commit',
    } });
    expect(getRow()).toMatchObject({ status: 'cancelled', resolvedAt: 2_000,
      xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null });
  });

  it('completes at the deadline instead of cancelling', async () => {
    const { getRow, useCase } = setup(running(), 301_000);
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'fresh_commit', resolvedAt: 301_000,
    } });
    expect(getRow()).toMatchObject({ status: 'completed' });
  });

  it('completes after the deadline instead of cancelling', async () => {
    const { getRow, useCase } = setup(running(), 301_001);
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'fresh_commit', resolvedAt: 301_001,
    } });
    expect(getRow()).toMatchObject({ status: 'completed', resolvedAt: 301_001 });
  });

  it('returns existing terminal truth without another write', async () => {
    const { transition, useCase } = setup(running({ status: 'cancelled', resolvedAt: 2_000,
      updatedAt: 2_000 }));
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'cancelled', freshness: 'existing_terminal',
    } });
    expect(transition).not.toHaveBeenCalled();
  });

  it('captures time before waiting in the coordinator queue', async () => {
    let now = 300_999;
    let row = running();
    const useCase = new CancelBreakUseCase({
      clock: { nowMs: () => now },
      coordinator: { run: async (work) => { now = 301_001; return work(); } },
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: row }),
        transitionFromRunningInTransaction: async (_scope, input) => {
          row = { ...row, status: input.status, resolvedAt: input.resolvedAt,
            updatedAt: input.updatedAt }; return { ok: true, value: 'updated' };
        },
      }, transaction,
    });
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'cancelled', resolvedAt: 300_999,
    } });
  });

  it('allows narrow recovery cancellation for a recognizable corrupt running Break', async () => {
    const { useCase } = setup(running({ updatedAt: 9_999 }), 2_000);
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'cancelled', freshness: 'recovery_commit',
    } });
  });

  it('maps read/write failures and rejects foreign identity', async () => {
    const read = new CancelBreakUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(), transaction,
      sessions: { findByIdInTransaction: async () => ({ ok: false,
        error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions') }),
        transitionFromRunningInTransaction: vi.fn() },
    });
    expect(await read.execute('break-1')).toMatchObject({ ok: false,
      error: { code: 'BREAK_CANCEL_READ_FAILED' } });
    const foreign = setup(running({ sessionType: 'focus', focusVariant: 'standard',
      mode: 'relax', workTag: 'coding' }));
    expect(await foreign.useCase.execute('break-1')).toMatchObject({ ok: false,
      error: { code: 'BREAK_CANCEL_STATE_INVALID' } });

    const write = new CancelBreakUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(), transaction,
      sessions: { findByIdInTransaction: async () => ({ ok: true, value: running() }),
        transitionFromRunningInTransaction: async () => ({ ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions') }) },
    });
    expect(await write.execute('break-1')).toMatchObject({ ok: false,
      error: { code: 'BREAK_CANCEL_WRITE_FAILED' } });
  });

  it('returns the exact terminal winner when the conditional transition loses', async () => {
    let row = running();
    const useCase = new CancelBreakUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(), transaction,
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: row }),
        transitionFromRunningInTransaction: async () => {
          row = running({ status: 'completed', resolvedAt: 301_000, updatedAt: 301_000 });
          return { ok: true, value: 'not_updated' };
        },
      },
    });
    expect(await useCase.execute('break-1')).toMatchObject({ ok: true, value: {
      outcome: 'completed', freshness: 'existing_terminal',
    } });
  });

  it('maps transaction failure and invalid command input', async () => {
    const useCase = new CancelBreakUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(),
      sessions: { findByIdInTransaction: vi.fn(), transitionFromRunningInTransaction: vi.fn() },
      transaction: { execute: async () => ({ ok: false, error: {
        kind: 'transaction_technical_error', code: 'TRANSACTION_WORK_FAILED',
      } }) },
    });
    expect(await useCase.execute('break-1')).toMatchObject({ ok: false,
      error: { code: 'BREAK_CANCEL_TRANSACTION_FAILED' } });
    expect(await useCase.execute('   ')).toMatchObject({ ok: false,
      error: { code: 'BREAK_CANCEL_STATE_INVALID' } });
  });
});
