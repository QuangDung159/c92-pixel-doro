import { describe, expect, it, vi } from 'vitest';

import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import { SessionCommandCoordinator } from './session-command.coordinator';
import { StartOnboardingTrialUseCase } from './start-onboarding-trial.use-case';

const scope: TransactionScope = { transactionId: Symbol('test') };
const transaction: TransactionPort = { execute: (work) => work(scope) };
const calendar = {
  snapshot: () => ({
    ok: true as const,
    value: { localDate: '2026-08-31', utcOffsetMinutes: 420 },
  }),
};

describe('StartOnboardingTrialUseCase', () => {
  it('commits the exact record before returning started', async () => {
    const insert = vi.fn(async (_scope, record: RunningSessionRecord) => ({
      ok: true as const,
      value: undefined,
    }));
    const useCase = new StartOnboardingTrialUseCase({
      calendar,
      clock: { nowMs: () => 10_000 },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => 'trial-1' },
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: null }),
        insertRunningInTransaction: insert,
      },
      transaction,
    });

    const result = await useCase.execute();

    expect(result).toEqual({
      ok: true,
      value: { outcome: 'started', session: expect.objectContaining({ id: 'trial-1' }) },
    });
    expect(insert).toHaveBeenCalledWith(scope, expect.objectContaining({
      configuredDurationMinutes: 5,
      endsAt: 310_000,
      focusVariant: 'onboarding_trial',
      mode: 'relax',
      workTag: null,
    }));
  });

  it('serializes two starts into one insert and one already-running success', async () => {
    let active: SessionRecord | null = null;
    let id = 0;
    const insert = vi.fn(async (_scope, record: RunningSessionRecord) => {
      active = record;
      return { ok: true as const, value: undefined };
    });
    const useCase = new StartOnboardingTrialUseCase({
      calendar,
      clock: { nowMs: () => 10_000 },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => `trial-${++id}` },
      sessions: {
        findActiveInTransaction: async () => ({ ok: true, value: active }),
        insertRunningInTransaction: insert,
      },
      transaction,
    });

    const [first, second] = await Promise.all([useCase.execute(), useCase.execute()]);

    expect(first.ok && first.value.outcome).toBe('started');
    expect(second.ok && second.value.outcome).toBe('already_running');
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('fails closed when another session is active', async () => {
    const useCase = new StartOnboardingTrialUseCase({
      calendar,
      clock: { nowMs: () => 10_000 },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => 'trial-1' },
      sessions: {
        findActiveInTransaction: async () => ({
          ok: true,
          value: { status: 'running', focusVariant: 'standard' } as SessionRecord,
        }),
        insertRunningInTransaction: vi.fn(),
      },
      transaction,
    });

    expect(await useCase.execute()).toEqual({
      ok: false,
      error: { kind: 'start_onboarding_trial_error', code: 'SESSION_START_CONFLICT' },
    });
  });
});
