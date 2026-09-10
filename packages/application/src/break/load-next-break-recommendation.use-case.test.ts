import { describe, expect, it, vi } from 'vitest';

import type { SessionRecord } from '../persistence/session.repository';
import { LoadNextBreakRecommendationUseCase } from './load-next-break-recommendation.use-case';

const completedStandard = (
  change: Partial<SessionRecord> = {},
): SessionRecord => ({
  id: 'focus-1',
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  status: 'completed',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  startedAt: 1_000,
  endsAt: 1_501_000,
  backgroundedAt: null,
  resolvedAt: 1_501_000,
  xpEarned: 25,
  coinsEarned: 5,
  rewardClaimedAt: 1_501_000,
  scheduledEndLocalDate: '2026-09-08',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000,
  updatedAt: 1_501_000,
  ...change,
});

const harness = (
  source: SessionRecord | null = completedStandard(),
  count = 4,
) => {
  const findById = vi.fn(async () => ({ ok: true as const, value: source }));
  const getFacts = vi.fn(async () => ({
    ok: true as const,
    value: {
      profileId: 1,
      completedStandardFocusCountSinceLastCompletedLongBreak: count,
      latestCompletedLongBreak: null,
    },
  }));
  return {
    findById,
    getFacts,
    useCase: new LoadNextBreakRecommendationUseCase({
      sessions: { findById },
      longBreakCadence: { getFacts },
    }),
  };
};

describe('LoadNextBreakRecommendationUseCase', () => {
  it.each([
    [0, 'short', 'short_break', 5],
    [3, 'short', 'short_break', 5],
    [4, 'long', 'long_break', 15],
    [8, 'long', 'long_break', 15],
  ] as const)('maps current durable count %s to %s', async (
    count,
    kind,
    sessionType,
    durationMinutes,
  ) => {
    const { useCase } = harness(completedStandard(), count);
    expect(await useCase.execute('focus-1')).toEqual({
      ok: true,
      value: {
        outcome: 'ready',
        sourceSessionId: 'focus-1',
        recommendation: { kind, sessionType, durationMinutes },
        completedStandardFocusCountSinceLastCompletedLongBreak: count,
        latestCompletedLongBreakSessionId: null,
      },
    });
  });

  it.each([
    ['missing', null],
    ['trial', completedStandard({ focusVariant: 'onboarding_trial' })],
    ['running', completedStandard({ status: 'running', resolvedAt: null })],
    ['failed', completedStandard({ status: 'failed' })],
    ['cancelled', completedStandard({ status: 'cancelled' })],
    ['break', completedStandard({ sessionType: 'short_break', focusVariant: null })],
    ['foreign', completedStandard({ profileId: 2 })],
    ['mismatched', completedStandard({ id: 'another-focus' })],
  ])('rejects an ineligible %s exact source', async (_label, source) => {
    const { useCase, getFacts } = harness(source as SessionRecord | null);
    expect(await useCase.execute('focus-1')).toEqual({
      ok: false,
      error: {
        kind: 'load_next_break_recommendation_error',
        code: 'BREAK_RECOMMENDATION_SOURCE_INELIGIBLE',
      },
    });
    expect(getFacts).not.toHaveBeenCalled();
  });

  it('rejects blank identity before reading persistence', async () => {
    const { useCase, findById, getFacts } = harness();
    expect(await useCase.execute('  ')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_SOURCE_INELIGIBLE' },
    });
    expect(findById).not.toHaveBeenCalled();
    expect(getFacts).not.toHaveBeenCalled();
  });

  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid cadence count %s instead of falling back',
    async (count) => {
      const { useCase } = harness(completedStandard(), count);
      expect(await useCase.execute('focus-1')).toMatchObject({
        ok: false,
        error: { code: 'BREAK_RECOMMENDATION_FACTS_INVALID' },
      });
    },
  );

  it('validates marker identity and timestamp', async () => {
    const { findById } = harness();
    const useCase = new LoadNextBreakRecommendationUseCase({
      sessions: { findById },
      longBreakCadence: {
        getFacts: async () => ({
          ok: true,
          value: {
            profileId: 1,
            completedStandardFocusCountSinceLastCompletedLongBreak: 1,
            latestCompletedLongBreak: { sessionId: ' ', resolvedAt: -1 },
          },
        }),
      },
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_FACTS_INVALID' },
    });
  });

  it('rejects cadence facts for another profile', async () => {
    const { findById } = harness();
    const useCase = new LoadNextBreakRecommendationUseCase({
      sessions: { findById },
      longBreakCadence: {
        getFacts: async () => ({
          ok: true,
          value: {
            profileId: 2,
            completedStandardFocusCountSinceLastCompletedLongBreak: 4,
            latestCompletedLongBreak: null,
          },
        }),
      },
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_FACTS_INVALID' },
    });
  });

  it('maps cadence query failure to a finite read error', async () => {
    const { findById } = harness();
    const useCase = new LoadNextBreakRecommendationUseCase({
      sessions: { findById },
      longBreakCadence: {
        getFacts: async () => ({
          ok: false,
          error: {
            kind: 'persistence_error',
            code: 'PERSISTENCE_QUERY_FAILED',
            entity: 'sessions',
            field: 'cadence',
          },
        }),
      },
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_READ_FAILED' },
    });
  });

  it('maps persistence failures and thrown reads to one finite error', async () => {
    const unavailable = new LoadNextBreakRecommendationUseCase({
      sessions: {
        findById: async () => ({
          ok: false,
          error: {
            kind: 'persistence_error',
            code: 'PERSISTENCE_QUERY_FAILED',
            entity: 'sessions',
            field: null,
          },
        }),
      },
      longBreakCadence: { getFacts: vi.fn() },
    });
    expect(await unavailable.execute('focus-1')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_READ_FAILED' },
    });

    const thrown = new LoadNextBreakRecommendationUseCase({
      sessions: { findById: async () => { throw new Error('offline'); } },
      longBreakCadence: { getFacts: vi.fn() },
    });
    expect(await thrown.execute('focus-1')).toMatchObject({
      ok: false,
      error: { code: 'BREAK_RECOMMENDATION_READ_FAILED' },
    });
  });
});
