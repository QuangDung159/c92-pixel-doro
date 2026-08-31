import {
  persistenceError,
  type SessionRecord,
} from '@pixeldoro/application';

import type {
  FirstUseInstallationReader,
  FirstUseSessionReader,
  InstallationRecord,
} from '@/application';

export type FirstUseEntryReviewScenario =
  | 'first_use_new'
  | 'first_use_returning'
  | 'first_use_running'
  | 'first_use_completed'
  | 'first_use_cancelled'
  | 'first_use_read_error';

export interface FirstUseEntryReviewFixture {
  readonly scenario: FirstUseEntryReviewScenario;
  readonly installation: FirstUseInstallationReader;
  readonly sessions: FirstUseSessionReader;
}

const scenarios = new Set<FirstUseEntryReviewScenario>([
  'first_use_new',
  'first_use_returning',
  'first_use_running',
  'first_use_completed',
  'first_use_cancelled',
  'first_use_read_error',
]);

const timestamp = 1_788_115_200_000;

const installation = (completed: boolean): InstallationRecord => ({
  id: 1,
  installedAt: timestamp,
  onboardingCompletedAt: completed ? timestamp + 1 : null,
  anonymousAnalyticsId: null,
  createdAt: timestamp,
  updatedAt: completed ? timestamp + 1 : timestamp,
});

const trial = (
  status: 'running' | 'completed' | 'cancelled',
): SessionRecord => ({
  id: `epic-05-entry-${status}`,
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'onboarding_trial',
  mode: 'relax',
  status,
  workTag: null,
  configuredDurationMinutes: 5,
  startedAt: timestamp,
  endsAt: timestamp + 300_000,
  backgroundedAt: null,
  resolvedAt: status === 'running' ? null : timestamp + 300_000,
  xpEarned: status === 'completed' ? 5 : 0,
  coinsEarned: status === 'completed' ? 1 : 0,
  rewardClaimedAt: status === 'completed' ? timestamp + 300_000 : null,
  scheduledEndLocalDate: '2026-08-31',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: timestamp,
  updatedAt: status === 'running' ? timestamp : timestamp + 300_000,
});

const isScenario = (value: string): value is FirstUseEntryReviewScenario =>
  scenarios.has(value as FirstUseEntryReviewScenario);

export const createFirstUseEntryReviewFixture = (
  value: string | undefined,
  enabled: boolean,
): FirstUseEntryReviewFixture | undefined => {
  if (!enabled || value === undefined || !isScenario(value)) return undefined;

  if (value === 'first_use_read_error') {
    let attempts = 0;
    return {
      scenario: value,
      installation: {
        find: async () => {
          attempts += 1;
          return attempts === 1
            ? {
                ok: false,
                error: persistenceError(
                  'PERSISTENCE_QUERY_FAILED',
                  'app_installation',
                ),
              }
            : { ok: true, value: installation(false) };
        },
      },
      sessions: { findLatestOnboardingTrial: async () => ({ ok: true, value: null }) },
    };
  }

  const completed = value === 'first_use_returning';
  const status = value.replace('first_use_', '');
  const session =
    status === 'running' || status === 'completed' || status === 'cancelled'
      ? trial(status)
      : null;

  return {
    scenario: value,
    installation: {
      find: async () => ({ ok: true, value: installation(completed) }),
    },
    sessions: {
      findLatestOnboardingTrial: async () => ({ ok: true, value: session }),
    },
  };
};
