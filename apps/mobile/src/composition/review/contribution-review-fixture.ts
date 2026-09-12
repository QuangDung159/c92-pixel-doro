import {
  persistenceError,
  type ClockPort,
  type ContributionDayFact,
  type ContributionQuery,
  type LocalCalendarPort,
} from '@pixeldoro/application';

export type ContributionReviewScenario =
  | 'contribution_zero_week'
  | 'contribution_mixed_week'
  | 'contribution_threshold_edges'
  | 'contribution_cross_midnight'
  | 'contribution_timezone_changed'
  | 'contribution_read_failure_once';

const scenarios = new Set<ContributionReviewScenario>([
  'contribution_zero_week',
  'contribution_mixed_week',
  'contribution_threshold_edges',
  'contribution_cross_midnight',
  'contribution_timezone_changed',
  'contribution_read_failure_once',
]);

export const resolveContributionReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): ContributionReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as ContributionReviewScenario)
    ? value as ContributionReviewScenario
    : undefined;

export const contributionReviewDatabaseName = (
  scenario: ContributionReviewScenario,
): string => `pixeldoro-us-09-03-${scenario}.db`;

export interface ContributionReviewFixture {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly contribution: ContributionQuery;
  readonly databaseName: string;
  readonly scenario: ContributionReviewScenario;
  prepare(dependencies: {
    readonly installation: {
      setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
    };
  }): Promise<boolean>;
}

const factsFor = (
  scenario: ContributionReviewScenario,
): readonly ContributionDayFact[] => {
  if (scenario === 'contribution_zero_week') return [];
  if (scenario === 'contribution_cross_midnight' || scenario === 'contribution_timezone_changed') {
    return [{
      scheduledEndLocalDate: '2026-09-11',
      totalCompletedMinutes: 25,
      completedSessionCount: 1,
    }];
  }
  return [
    { scheduledEndLocalDate: '2026-09-06', totalCompletedMinutes: 15, completedSessionCount: 1 },
    { scheduledEndLocalDate: '2026-09-08', totalCompletedMinutes: 25, completedSessionCount: 1 },
    { scheduledEndLocalDate: '2026-09-10', totalCompletedMinutes: 50, completedSessionCount: 2 },
    { scheduledEndLocalDate: '2026-09-12', totalCompletedMinutes: 100, completedSessionCount: 4 },
  ];
};

export const createContributionReviewFixture = (
  scenario: ContributionReviewScenario | undefined,
): ContributionReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  const endLocalDate = scenario === 'contribution_timezone_changed'
    ? '2026-09-13'
    : '2026-09-12';
  let failed = false;
  return {
    scenario,
    databaseName: contributionReviewDatabaseName(scenario),
    clock: { nowMs: () => 1_789_171_200_000 },
    calendar: { snapshot: () => ({
      ok: true,
      value: { localDate: endLocalDate, utcOffsetMinutes: 420 },
    }) },
    contribution: {
      listRange: async () => {
        if (scenario === 'contribution_read_failure_once' && !failed) {
          failed = true;
          return {
            ok: false,
            error: persistenceError(
              'PERSISTENCE_QUERY_FAILED',
              'sessions',
              'review_contribution_once',
            ),
          };
        }
        return { ok: true, value: factsFor(scenario) };
      },
    },
    prepare: async ({ installation }) => {
      await installation.setOnboardingCompleted(1_789_171_200_000, 1_789_171_200_000);
      return true;
    },
  };
};
