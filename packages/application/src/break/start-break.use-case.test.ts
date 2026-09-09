import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import { persistenceError } from '../persistence/persistence.error';
import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import { transactionTechnicalError } from '../ports/transaction.error';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { StartBreakUseCase } from './start-break.use-case';

const scope: TransactionScope = { transactionId: Symbol('break-start') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const completedFocus: SessionRecord = {
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'completed', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: 1_501_000,
  xpEarned: 25, coinsEarned: 5, rewardClaimedAt: 1_501_000,
  scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_501_000,
};

const createUseCase = (
  overrides: Partial<ConstructorParameters<typeof StartBreakUseCase>[0]> = {},
) => new StartBreakUseCase({
  calendar: { snapshot: () => ({
    ok: true, value: { localDate: '2026-09-09', utcOffsetMinutes: 420 },
  }) },
  clock: { nowMs: () => 2_000_000 },
  coordinator: new SessionCommandCoordinator(),
  id: { nextId: () => 'break-1' },
  longBreakCadence: { getFactsInTransaction: async () => ({
    ok: true,
    value: {
      profileId: 1,
      completedStandardFocusCountSinceLastCompletedLongBreak: 1,
      latestCompletedLongBreak: null,
    },
  }) },
  sessions: {
    findByIdInTransaction: async () => ({ ok: true, value: completedFocus }),
    findActiveInTransaction: async () => ({ ok: true, value: null }),
    insertRunningInTransaction: async () => ({ ok: true, value: undefined }),
  },
  transaction,
  ...overrides,
});

describe('StartBreakUseCase', () => {
  it.each([
    [0, 'short_break', 5],
    [4, 'long_break', 15],
    [8, 'long_break', 15],
  ] as const)('commits current cadence count %s', async (count, sessionType, minutes) => {
    const insert = vi.fn(async (_scope, _record: RunningSessionRecord) => ({
      ok: true as const, value: undefined,
    }));
    const useCase = createUseCase({
      longBreakCadence: { getFactsInTransaction: async () => ({
        ok: true,
        value: {
          profileId: 1,
          completedStandardFocusCountSinceLastCompletedLongBreak: count,
          latestCompletedLongBreak: null,
        },
      }) },
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: completedFocus }),
        findActiveInTransaction: async () => ({ ok: true, value: null }),
        insertRunningInTransaction: insert,
      },
    });
    const result = await useCase.execute({ sourceFocusSessionId: 'focus-1' });
    expect(result).toMatchObject({
      ok: true,
      value: { outcome: 'started', sourceFocusSessionId: 'focus-1', session: {
        id: 'break-1', sessionType, configuredDurationMinutes: minutes,
        status: 'running', focusVariant: null, mode: null, workTag: null,
        xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
      } },
    });
    expect(insert).toHaveBeenCalledOnce();
  });

  it('rejects an ineligible source before cadence, active read, or insert', async () => {
    const getFactsInTransaction = vi.fn();
    const findActiveInTransaction = vi.fn();
    const insertRunningInTransaction = vi.fn();
    const useCase = createUseCase({
      longBreakCadence: { getFactsInTransaction },
      sessions: {
        findByIdInTransaction: async () => ({
          ok: true, value: { ...completedFocus, status: 'cancelled' },
        }),
        findActiveInTransaction,
        insertRunningInTransaction,
      },
    });
    expect(await useCase.execute({ sourceFocusSessionId: 'focus-1' })).toMatchObject({
      ok: false, error: { code: 'BREAK_SOURCE_INELIGIBLE' },
    });
    expect(getFactsInTransaction).not.toHaveBeenCalled();
    expect(findActiveInTransaction).not.toHaveBeenCalled();
    expect(insertRunningInTransaction).not.toHaveBeenCalled();
  });

  it('preserves an existing active session', async () => {
    const insertRunningInTransaction = vi.fn();
    const useCase = createUseCase({
      sessions: {
        findByIdInTransaction: async () => ({ ok: true, value: completedFocus }),
        findActiveInTransaction: async () => ({ ok: true, value: {
          ...completedFocus, id: 'active-focus', status: 'running', resolvedAt: null,
          rewardClaimedAt: null, xpEarned: 0, coinsEarned: 0, updatedAt: 1_000,
        } as RunningSessionRecord }),
        insertRunningInTransaction,
      },
    });
    expect(await useCase.execute({ sourceFocusSessionId: 'focus-1' })).toMatchObject({
      ok: false, error: { code: 'SESSION_START_CONFLICT' },
    });
    expect(insertRunningInTransaction).not.toHaveBeenCalled();
  });

  it('maps cadence, insert, and transaction failures', async () => {
    const cadence = createUseCase({
      longBreakCadence: { getFactsInTransaction: async () => ({
        ok: false, error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
      }) },
    });
    expect(await cadence.execute({ sourceFocusSessionId: 'focus-1' })).toMatchObject({
      ok: false, error: { code: 'BREAK_CADENCE_READ_FAILED' },
    });

    const insert = createUseCase({ sessions: {
      findByIdInTransaction: async () => ({ ok: true, value: completedFocus }),
      findActiveInTransaction: async () => ({ ok: true, value: null }),
      insertRunningInTransaction: async () => ({
        ok: false, error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions'),
      }),
    } });
    expect(await insert.execute({ sourceFocusSessionId: 'focus-1' })).toMatchObject({
      ok: false, error: { code: 'SESSION_START_WRITE_FAILED' },
    });

    const technical = createUseCase({ transaction: { execute: async () => ({
      ok: false, error: transactionTechnicalError('TRANSACTION_COMMIT_FAILED'),
    }) } });
    expect(await technical.execute({ sourceFocusSessionId: 'focus-1' })).toMatchObject({
      ok: false, error: { code: 'SESSION_START_TRANSACTION_FAILED' },
    });
  });
});
