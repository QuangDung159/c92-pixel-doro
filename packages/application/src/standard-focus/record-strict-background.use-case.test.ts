import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import type { RunningSessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { RecordStrictBackgroundUseCase } from './record-strict-background.use-case';

const scope: TransactionScope = { transactionId: Symbol('strict-background') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const strict = (change: Partial<RunningSessionRecord> = {}): RunningSessionRecord => ({
  id: 'strict-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'strict', status: 'running', workTag: 'coding', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000, ...change,
});

describe('RecordStrictBackgroundUseCase', () => {
  it('persists the captured lifecycle timestamp exactly once', async () => {
    const record = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
    const useCase = new RecordStrictBackgroundUseCase({
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: strict() }),
        findByIdInTransaction: vi.fn(),
        recordBackgroundedAtInTransaction: record,
      },
      transaction,
    });
    expect(await useCase.execute(2_000)).toEqual({
      ok: true,
      value: { outcome: 'recorded', sessionId: 'strict-1' },
    });
    expect(record).toHaveBeenCalledWith(scope, {
      sessionId: 'strict-1', backgroundedAt: 2_000, updatedAt: 2_000,
    });
  });

  it.each([
    [strict({ backgroundedAt: 1_500 }), 2_000, 'already_recorded'],
    [strict({ updatedAt: 2_100 }), 2_000, 'stale_event'],
    [strict(), 901_000, 'deadline_pending'],
  ] as const)('returns %s without replacing durable evidence', async (active, capturedAt, outcome) => {
    const record = vi.fn();
    const useCase = new RecordStrictBackgroundUseCase({
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: active }),
        findByIdInTransaction: vi.fn(),
        recordBackgroundedAtInTransaction: record,
      },
      transaction,
    });
    expect(await useCase.execute(capturedAt)).toMatchObject({
      ok: true, value: { outcome, sessionId: 'strict-1' },
    });
    expect(record).not.toHaveBeenCalled();
  });

  it('never writes Strict evidence for a Relax Standard session', async () => {
    const record = vi.fn();
    const useCase = new RecordStrictBackgroundUseCase({
      coordinator: new SessionCommandCoordinator(),
      sessions: {
        findActiveInTransaction: async () => ({
          ok: true, value: strict({ mode: 'relax' }),
        }),
        findByIdInTransaction: vi.fn(),
        recordBackgroundedAtInTransaction: record,
      },
      transaction,
    });
    expect(await useCase.execute(2_000)).toEqual({
      ok: true, value: { outcome: 'not_strict_standard' },
    });
    expect(record).not.toHaveBeenCalled();
  });
});
