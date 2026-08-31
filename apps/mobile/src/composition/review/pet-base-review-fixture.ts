import {
  persistenceError,
  type PetCompanionSessionReader,
  type SessionRecord,
  type SessionType,
} from '@pixeldoro/application';

export type PetBaseReviewScenario =
  | 'idle'
  | 'focus'
  | 'short_break'
  | 'long_break'
  | 'error';

const scenarios = new Set<PetBaseReviewScenario>([
  'idle',
  'focus',
  'short_break',
  'long_break',
  'error',
]);

const runningFixture = (sessionType: SessionType): SessionRecord => {
  const durationMinutes = sessionType === 'focus'
    ? 25
    : sessionType === 'long_break'
      ? 15
      : 5;
  return {
  id: `review-fixture:${sessionType}`,
  profileId: 1,
  sessionType,
  focusVariant: sessionType === 'focus' ? 'standard' : null,
  mode: sessionType === 'focus' ? 'relax' : null,
  status: 'running',
  workTag: sessionType === 'focus' ? 'coding' : null,
  configuredDurationMinutes: durationMinutes,
  startedAt: 1,
  endsAt: 1 + durationMinutes * 60_000,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-08-30',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1,
  updatedAt: 1,
  };
};

export const createPetBaseReviewSessionReader = (
  value: string | undefined,
  enabled: boolean,
): PetCompanionSessionReader | undefined => {
  if (!enabled || value === undefined || !scenarios.has(value as PetBaseReviewScenario)) {
    return undefined;
  }

  const scenario = value as PetBaseReviewScenario;
  return Object.freeze({
    findActive: async () => {
      if (scenario === 'error') {
        return {
          ok: false as const,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
        };
      }
      return {
        ok: true as const,
        value: scenario === 'idle' ? null : runningFixture(scenario),
      };
    },
  });
};
