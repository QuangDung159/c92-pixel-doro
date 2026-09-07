import { describe, expect, it, vi } from 'vitest';

import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import { persistenceError } from '../persistence/persistence.error';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { transactionTechnicalError } from '../ports/transaction.error';
import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import { StartStandardFocusUseCase } from './start-standard-focus.use-case';

const scope: TransactionScope = { transactionId: Symbol('standard-focus') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const calendar = {
  snapshot: vi.fn(() => ({
    ok: true as const,
    value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
  })),
};
const configuration = {
  durationMinutes: 25,
  mode: 'relax' as const,
  workTag: 'coding' as const,
};

const createUseCase = (
  overrides: Partial<ConstructorParameters<typeof StartStandardFocusUseCase>[0]> = {},
) => new StartStandardFocusUseCase({
  calendar,
  clock: { nowMs: () => 10_000 },
  coordinator: new SessionCommandCoordinator(),
  id: { nextId: () => 'focus-1' },
  sessions: {
    findActiveInTransaction: async () => ({ ok: true, value: null }),
    insertRunningInTransaction: async () => ({ ok: true, value: undefined }),
  },
  transaction,
  ...overrides,
});

describe('StartStandardFocusUseCase', () => {
  it('commits an exact record before returning success', async () => {
    const insert = vi.fn(async (_scope, _record: RunningSessionRecord) => ({
      ok: true as const,
      value: undefined,
    }));
    const useCase = createUseCase({
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: null }),
        insertRunningInTransaction: insert,
      },
    });

    const result = await useCase.execute(configuration);

    expect(result).toMatchObject({
      ok: true,
      value: { outcome: 'started', session: { id: 'focus-1' } },
    });
    expect(insert).toHaveBeenCalledWith(scope, expect.objectContaining({
      focusVariant: 'standard',
      configuredDurationMinutes: 25,
      endsAt: 1_510_000,
      mode: 'relax',
      workTag: 'coding',
    }));
  });

  it('rejects invalid input before clock, calendar, id, transaction, or write', async () => {
    const nowMs = vi.fn();
    const execute = vi.fn();
    const nextId = vi.fn();
    const useCase = createUseCase({
      clock: { nowMs },
      id: { nextId },
      transaction: { execute },
    });

    expect(await useCase.execute({ ...configuration, durationMinutes: 17 })).toEqual({
      ok: false,
      error: {
        kind: 'start_standard_focus_error',
        code: 'STANDARD_FOCUS_CONFIG_INVALID',
      },
    });
    expect(nowMs).not.toHaveBeenCalled();
    expect(nextId).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('serializes concurrent starts and rejects the second active conflict', async () => {
    let active: SessionRecord | null = null;
    const insert = vi.fn(async (_scope, record: RunningSessionRecord) => {
      active = record;
      return { ok: true as const, value: undefined };
    });
    const useCase = createUseCase({
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: active }),
        insertRunningInTransaction: insert,
      },
    });

    const [first, second] = await Promise.all([
      useCase.execute(configuration),
      useCase.execute(configuration),
    ]);

    expect(first.ok).toBe(true);
    expect(second).toEqual({
      ok: false,
      error: {
        kind: 'start_standard_focus_error',
        code: 'SESSION_START_CONFLICT',
      },
    });
    expect(insert).toHaveBeenCalledOnce();
  });

  it('maps a unique write conflict to the stable active-session error', async () => {
    const useCase = createUseCase({
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: null }),
        insertRunningInTransaction: async () => ({
          ok: false,
          error: persistenceError('PERSISTENCE_CONFLICT', 'sessions'),
        }),
      },
    });

    expect(await useCase.execute(configuration)).toMatchObject({
      ok: false,
      error: { code: 'SESSION_START_CONFLICT' },
    });
  });

  it('maps calendar, read, write, and transaction failures without partial success', async () => {
    const calendarFailure = createUseCase({
      calendar: { snapshot: () => ({
        ok: false,
        error: { kind: 'local_calendar_error', code: 'LOCAL_CALENDAR_SNAPSHOT_FAILED' },
      }) },
    });
    expect(await calendarFailure.execute(configuration)).toMatchObject({
      ok: false, error: { code: 'SESSION_TIME_INVALID' },
    });

    const readFailure = createUseCase({
      sessions: {
        findActiveInTransaction: async () => ({
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
        }),
        insertRunningInTransaction: vi.fn(),
      },
    });
    expect(await readFailure.execute(configuration)).toMatchObject({
      ok: false, error: { code: 'SESSION_START_READ_FAILED' },
    });

    const writeFailure = createUseCase({
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: null }),
        insertRunningInTransaction: async () => ({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions'),
        }),
      },
    });
    expect(await writeFailure.execute(configuration)).toMatchObject({
      ok: false, error: { code: 'SESSION_START_WRITE_FAILED' },
    });

    const transactionFailure = createUseCase({
      transaction: {
        execute: async () => ({
          ok: false,
          error: transactionTechnicalError('TRANSACTION_COMMIT_FAILED'),
        }),
      },
    });
    expect(await transactionFailure.execute(configuration)).toMatchObject({
      ok: false, error: { code: 'SESSION_START_TRANSACTION_FAILED' },
    });
  });
});
