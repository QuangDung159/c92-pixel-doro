import type {
  AnalyticsDeliveryPort,
  FeedbackSubmissionPort,
  StoreReviewFactsQuery,
  StoreReviewPort,
} from '@/application';
import {
  STORE_REVIEW_COOLDOWN_MS,
  STORE_REVIEW_MIN_INSTALL_AGE_MS,
} from '@/application';

export const EPIC_11_REVIEW_SCENARIOS = [
  'epic_11_quick',
  'epic_11_analytics_failure_once',
  'epic_11_feedback_failure_once',
  'epic_11_review_eligible',
  'epic_11_review_cooldown',
  'epic_11_review_unavailable',
] as const;

export type Epic11ReviewScenario = typeof EPIC_11_REVIEW_SCENARIOS[number];

export const resolveEpic11ReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): Epic11ReviewScenario | undefined => enabled && value !== undefined &&
  EPIC_11_REVIEW_SCENARIOS.includes(value as Epic11ReviewScenario)
  ? value as Epic11ReviewScenario
  : undefined;

export const epic11ReviewDatabaseName = (scenario: Epic11ReviewScenario): string =>
  `pixeldoro-us-11-${scenario.replaceAll('_', '-')}.db`;

export interface Epic11ReviewFixture {
  readonly analytics: AnalyticsDeliveryPort;
  readonly feedback: FeedbackSubmissionPort;
  readonly review: StoreReviewPort;
  readonly reviewFacts?: StoreReviewFactsQuery;
  readonly productionReview: boolean;
}

export const createEpic11ReviewFixture = (
  scenario: Epic11ReviewScenario | undefined,
  baseReviewFacts?: StoreReviewFactsQuery,
): Epic11ReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let analyticsFailurePending = scenario === 'epic_11_analytics_failure_once';
  let feedbackFailurePending = scenario === 'epic_11_feedback_failure_once';
  const useEligibleFacts = scenario === 'epic_11_quick' ||
    scenario === 'epic_11_review_eligible';
  const useCooldownFacts = scenario === 'epic_11_review_cooldown';
  const reviewFacts: StoreReviewFactsQuery | undefined =
    (useEligibleFacts || useCooldownFacts) && baseReviewFacts !== undefined
      ? {
          getFacts: async (input) => {
            const base = await baseReviewFacts.getFacts(input);
            if (!base.ok) return base;
            return {
              ok: true,
              value: {
                ...base.value,
                installedAt: input.nowMs - STORE_REVIEW_MIN_INSTALL_AGE_MS,
                completedStandardFocusCount: 5,
                distinctStandardFocusActiveDayCount: 3,
                ...(useCooldownFacts
                  ? {
                      latestAttempt: {
                        id: 'fixture-cooldown-attempt',
                        appVersion: 'fixture-previous-version',
                        attemptedAt: input.nowMs - STORE_REVIEW_COOLDOWN_MS + 1,
                      },
                      rolling365DayAttemptCount: 1,
                      currentVersionAttempted: false,
                    }
                  : {}),
              },
            };
          },
        }
      : undefined;
  return {
    analytics: {
      deliver: () => {
        if (analyticsFailurePending) {
          analyticsFailurePending = false;
          return Promise.resolve('retryable');
        }
        return Promise.resolve('accepted');
      },
    },
    feedback: {
      submit: () => {
        if (feedbackFailurePending) {
          feedbackFailurePending = false;
          return Promise.resolve('retryable');
        }
        return Promise.resolve('accepted');
      },
    },
    review: {
      isAvailable: () => Promise.resolve(scenario !== 'epic_11_review_unavailable'),
      request: () => Promise.resolve(),
    },
    ...(reviewFacts === undefined ? {} : { reviewFacts }),
    productionReview: true,
  };
};
