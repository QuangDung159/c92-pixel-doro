import { describe, expect, it, vi } from 'vitest';

import { persistenceError } from '../persistence/persistence.error';
import {
  LoadDailyContributionUseCase,
  type LoadDailyContributionDependencies,
} from './load-daily-contribution.use-case';

const dependencies = (
  overrides: Partial<LoadDailyContributionDependencies> = {},
): LoadDailyContributionDependencies => ({
  calendar: {
    snapshot: vi.fn(() => ({
      ok: true as const,
      value: { localDate: '2026-09-12', utcOffsetMinutes: 420 },
    })),
  },
  clock: { nowMs: vi.fn(() => 1_788_950_000_000) },
  contribution: {
    listRange: vi.fn(async () => ({
      ok: true as const,
      value: [{
        scheduledEndLocalDate: '2026-09-12',
        totalCompletedMinutes: 25,
        completedSessionCount: 1,
      }],
    })),
  },
  ...overrides,
});

describe('LoadDailyContributionUseCase', () => {
  it('uses injected current local date and queries exact seven-day range', async () => {
    const snapshot = vi.fn(() => ({
      ok: true as const,
      value: { localDate: '2026-09-12', utcOffsetMinutes: 420 },
    }));
    const listRange = vi.fn(async () => ({
      ok: true as const,
      value: [{
        scheduledEndLocalDate: '2026-09-12',
        totalCompletedMinutes: 25,
        completedSessionCount: 1,
      }],
    }));
    const deps = dependencies({
      calendar: { snapshot },
      contribution: { listRange },
    });
    const result = await new LoadDailyContributionUseCase(deps).execute();
    expect(snapshot).toHaveBeenCalledWith(1_788_950_000_000);
    expect(listRange).toHaveBeenCalledWith({
      profileId: 1,
      startLocalDate: '2026-09-06',
      endLocalDate: '2026-09-12',
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        startLocalDate: '2026-09-06',
        endLocalDate: '2026-09-12',
        days: [
          { localDate: '2026-09-06', completedMinutes: 0 },
          {}, {}, {}, {}, {},
          { localDate: '2026-09-12', completedMinutes: 25, intensity: 'medium' },
        ],
      },
    });
  });

  it('maps clock and calendar failures to date unavailable', async () => {
    const assertUnavailable = async (deps: LoadDailyContributionDependencies) => {
      await expect(new LoadDailyContributionUseCase(deps).execute()).resolves.toMatchObject({
        ok: false,
        error: { code: 'CONTRIBUTION_DATE_UNAVAILABLE' },
      });
    };
    await assertUnavailable(dependencies({ clock: { nowMs: () => Number.NaN } }));
    await assertUnavailable(dependencies({
      clock: { nowMs: () => { throw new Error('clock'); } },
    }));
    await assertUnavailable(dependencies({
      calendar: { snapshot: () => ({
        ok: false,
        error: {
          kind: 'local_calendar_error',
          code: 'LOCAL_CALENDAR_SNAPSHOT_FAILED',
        },
      }) },
    }));
    await expect(new LoadDailyContributionUseCase(dependencies({
      clock: { nowMs: () => -1 },
    })).execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CONTRIBUTION_DATE_UNAVAILABLE' },
    });
  });

  it.each([
    ['unavailable', persistenceError('PERSISTENCE_UNAVAILABLE', 'sessions'), 'CONTRIBUTION_READ_FAILED'],
    ['query', persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'), 'CONTRIBUTION_READ_FAILED'],
    ['corrupt', persistenceError('PERSISTENCE_CORRUPT_DATA', 'sessions'), 'CONTRIBUTION_DATA_INVALID'],
    ['mismatch', persistenceError('PERSISTENCE_INVARIANT_MISMATCH', 'sessions'), 'CONTRIBUTION_DATA_INVALID'],
  ] as const)('maps %s persistence error', async (_label, error, code) => {
    const deps = dependencies({
      contribution: { listRange: vi.fn(async () => ({ ok: false as const, error })) },
    });
    await expect(new LoadDailyContributionUseCase(deps).execute()).resolves.toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it('maps thrown query to technical failure and invalid facts to data invalid', async () => {
    const thrown = dependencies({
      contribution: { listRange: vi.fn(async () => { throw new Error('read'); }) },
    });
    await expect(new LoadDailyContributionUseCase(thrown).execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CONTRIBUTION_READ_FAILED' },
    });

    const invalid = dependencies({
      contribution: { listRange: vi.fn(async () => ({
        ok: true as const,
        value: [{
          scheduledEndLocalDate: '2026-09-05',
          totalCompletedMinutes: 25,
          completedSessionCount: 1,
        }],
      })) },
    });
    await expect(new LoadDailyContributionUseCase(invalid).execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CONTRIBUTION_DATA_INVALID' },
    });
  });
});
