import { describe, expect, it, vi } from 'vitest';

import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import { CancelStandardFocusUseCase } from './cancel-standard-focus.use-case';

const scope: TransactionScope = { transactionId: Symbol('standard-cancel') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const running = (): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

describe('CancelStandardFocusUseCase', () => {
  it('commits Relax cancellation with zero reward', async () => {
    const transition = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
    const useCase = new CancelStandardFocusUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: running() }),
        transitionFromRunningInTransaction: transition,
      },
      transaction,
    });
    expect(await useCase.execute('focus-1')).toEqual({
      ok: true, value: { outcome: 'cancelled', sessionId: 'focus-1' },
    });
    expect(transition).toHaveBeenCalledWith(scope, {
      sessionId: 'focus-1', status: 'cancelled', resolvedAt: 2_000,
      xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null, updatedAt: 2_000,
    });
  });

  it.each([
    [1_501_000, 'SESSION_DEADLINE_REACHED'],
    [1_501_001, 'SESSION_DEADLINE_REACHED'],
  ])('rejects cancellation at and after the deadline', async (nowMs, code) => {
    const transition = vi.fn();
    const useCase = new CancelStandardFocusUseCase({
      clock: { nowMs: () => nowMs }, coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: running() }),
        transitionFromRunningInTransaction: transition,
      }, transaction,
    });
    expect(await useCase.execute('focus-1')).toEqual({
      ok: false, error: { kind: 'cancel_standard_focus_error', code },
    });
    expect(transition).not.toHaveBeenCalled();
  });

  it('keeps Strict outside the Relax story', async () => {
    const strict = { ...running(), mode: 'strict' as const };
    const useCase = new CancelStandardFocusUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: strict }),
        transitionFromRunningInTransaction: vi.fn(),
      }, transaction,
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false, error: { code: 'SESSION_MODE_NOT_OWNED' },
    });
  });

  it('re-reads a conditional race winner and treats cancelled as idempotent', async () => {
    const cancelled = {
      ...running(), status: 'cancelled', resolvedAt: 2_000, updatedAt: 2_000,
    } as SessionRecord;
    let reads = 0;
    const useCase = new CancelStandardFocusUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({
          ok: true, value: reads++ === 0 ? running() : cancelled,
        }),
        transitionFromRunningInTransaction: async () => ({ ok: true, value: 'not_updated' }),
      }, transaction,
    });
    expect(await useCase.execute('focus-1')).toEqual({
      ok: true, value: { outcome: 'already_cancelled', sessionId: 'focus-1' },
    });
  });

  it('does not overwrite another terminal winner', async () => {
    const completed = {
      ...running(), status: 'completed', resolvedAt: 2_000, xpEarned: 25,
    } as SessionRecord;
    const useCase = new CancelStandardFocusUseCase({
      clock: { nowMs: () => 2_000 }, coordinator: new SessionCommandCoordinator(),
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: completed }),
        transitionFromRunningInTransaction: vi.fn(),
      }, transaction,
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false, error: { code: 'SESSION_ALREADY_TERMINAL' },
    });
  });
});
