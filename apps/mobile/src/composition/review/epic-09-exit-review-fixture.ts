import {
  CancelStandardFocusUseCase,
  ReconcileStandardFocusUseCase,
  RecordStrictBackgroundUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type ClockPort,
  type ContributionQuery,
  type LocalCalendarPort,
  type ProfileRepository,
  type RewardReceiptRepository,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type StandardFocusHistoryQuery,
  type TransactionPort,
} from '@pixeldoro/application';

import type { AnalyticsQueue } from '@/application';

export type Epic09ExitReviewScenario =
  | 'epic_09_empty'
  | 'epic_09_mixed_40'
  | 'epic_09_offline_relaunch'
  | 'epic_09_read_failure_once'
  | 'epic_09_analytics_failure_once'
  | 'epic_09_timezone_changed';

const scenarios = new Set<Epic09ExitReviewScenario>([
  'epic_09_empty',
  'epic_09_mixed_40',
  'epic_09_offline_relaunch',
  'epic_09_read_failure_once',
  'epic_09_analytics_failure_once',
  'epic_09_timezone_changed',
]);

export const resolveEpic09ExitReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): Epic09ExitReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as Epic09ExitReviewScenario)
    ? value as Epic09ExitReviewScenario
    : undefined;

export const epic09ExitReviewDatabaseName = (
  scenario: Epic09ExitReviewScenario,
): string => `pixeldoro-us-09-05-${scenario}.db`;

export interface Epic09ExitReviewFixtureDependencies {
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly installation: {
    setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
  };
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface Epic09ExitReviewFixture {
  readonly analyticsQueue: AnalyticsQueue;
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly contribution: ContributionQuery;
  readonly databaseName: string;
  readonly history: StandardFocusHistoryQuery;
  readonly scenario: Epic09ExitReviewScenario;
  prepare(dependencies: Epic09ExitReviewFixtureDependencies): Promise<boolean>;
}

const localDateFor = (index: number): string => {
  if (index === 0) return '2026-09-06';
  if (index === 1) return '2026-09-07';
  if (index === 2) return '2026-09-08';
  if (index <= 4) return '2026-09-09';
  if (index <= 8) return '2026-09-10';
  if (index <= 24) return '2026-09-11';
  return '2026-09-12';
};

const statusFor = (index: number): 'cancelled' | 'completed' | 'failed' => {
  if (index === 0) return 'cancelled';
  if (index <= 8) return 'completed';
  if (index % 9 === 0) return 'failed';
  if (index % 7 === 0) return 'cancelled';
  return 'completed';
};

const prepareExitHistory = async (
  scenario: Epic09ExitReviewScenario,
  dependencies: Epic09ExitReviewFixtureDependencies,
): Promise<boolean> => {
  const fixtureNow = 1_789_171_200_000;
  await dependencies.installation.setOnboardingCompleted(fixtureNow, fixtureNow);
  if (scenario === 'epic_09_empty') return true;

  const first = await dependencies.sessions.findById('us0905-history-00');
  const last = await dependencies.sessions.findById('us0905-history-39');
  if (!first.ok || !last.ok) throw new Error('epic_09_exit_history_read_failed');
  if (first.value !== null && last.value !== null) return false;
  if (first.value !== null || last.value !== null) {
    throw new Error('epic_09_exit_partial_seed_invalid');
  }

  let now = 1_789_056_000_000;
  let rewardSequence = 0;
  const clock = { nowMs: () => now };
  const rewardId = { nextId: () => `us0905-reward-${++rewardSequence}` };

  for (let index = 0; index < 40; index += 1) {
    const sessionId = `us0905-history-${String(index).padStart(2, '0')}`;
    const terminalStatus = statusFor(index);
    const started = await new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true as const,
        value: { localDate: localDateFor(index), utcOffsetMinutes: 420 },
      }) },
      clock,
      coordinator: dependencies.coordinator,
      id: { nextId: () => sessionId },
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({
      durationMinutes: index === 1 ? 15 : 25,
      mode: terminalStatus === 'failed' ? 'strict' : 'relax',
      workTag: index % 3 === 0 ? 'writing' : index % 3 === 1 ? 'study' : 'coding',
    });
    if (!started.ok) throw new Error(`epic_09_exit_start_failed_${index}`);

    if (terminalStatus === 'failed') {
      now += 1_000;
      const backgrounded = await new RecordStrictBackgroundUseCase({
        coordinator: dependencies.coordinator,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(now);
      if (!backgrounded.ok || backgrounded.value.outcome !== 'recorded') {
        throw new Error(`epic_09_exit_background_failed_${index}`);
      }
      now += 10_000;
      const reconciled = await new ReconcileStandardFocusUseCase({
        clock,
        coordinator: dependencies.coordinator,
        id: rewardId,
        profile: dependencies.profile,
        rewards: dependencies.rewards,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(sessionId);
      if (!reconciled.ok || reconciled.value.outcome !== 'failed') {
        throw new Error(`epic_09_exit_failure_failed_${index}`);
      }
      now = started.value.session.endsAt + 60_000;
      continue;
    }

    if (terminalStatus === 'cancelled') {
      now += 1_000;
      const cancelled = await new CancelStandardFocusUseCase({
        clock,
        coordinator: dependencies.coordinator,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(sessionId);
      if (!cancelled.ok || cancelled.value.outcome !== 'cancelled') {
        throw new Error(`epic_09_exit_cancel_failed_${index}`);
      }
      now = started.value.session.endsAt + 60_000;
      continue;
    }

    now = started.value.session.endsAt;
    const completed = await new ReconcileStandardFocusUseCase({
      clock,
      coordinator: dependencies.coordinator,
      id: rewardId,
      profile: dependencies.profile,
      rewards: dependencies.rewards,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute(sessionId);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error(`epic_09_exit_completion_failed_${index}`);
    }
    now += 60_000;
  }
  return true;
};

export const createEpic09ExitReviewFixture = (
  scenario: Epic09ExitReviewScenario | undefined,
  delegates: {
    readonly analyticsQueue: AnalyticsQueue;
    readonly contribution: ContributionQuery;
    readonly history: StandardFocusHistoryQuery;
  },
): Epic09ExitReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let analyticsFailed = false;
  let contributionFailed = false;
  let historyFailed = false;
  const failReadOnce = scenario === 'epic_09_read_failure_once';
  const endLocalDate = scenario === 'epic_09_timezone_changed' ? '2026-09-13' : '2026-09-12';

  return {
    scenario,
    databaseName: epic09ExitReviewDatabaseName(scenario),
    clock: { nowMs: () => 1_789_171_200_000 },
    calendar: { snapshot: () => ({
      ok: true,
      value: { localDate: endLocalDate, utcOffsetMinutes: 420 },
    }) },
    history: {
      list: (input) => {
        if (failReadOnce && !historyFailed) {
          historyFailed = true;
          return Promise.resolve({
            ok: false,
            error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'epic_09_history_once'),
          });
        }
        return delegates.history.list(input);
      },
    },
    contribution: {
      listRange: (input) => {
        if (failReadOnce && !contributionFailed) {
          contributionFailed = true;
          return Promise.resolve({
            ok: false,
            error: persistenceError(
              'PERSISTENCE_QUERY_FAILED',
              'sessions',
              'epic_09_contribution_once',
            ),
          });
        }
        return delegates.contribution.listRange(input);
      },
    },
    analyticsQueue: {
      enqueueBounded: (event, nowMs) => {
        if (scenario === 'epic_09_analytics_failure_once' && !analyticsFailed) {
          analyticsFailed = true;
          return Promise.resolve({
            ok: false,
            error: persistenceError(
              'PERSISTENCE_WRITE_FAILED',
              'analytics_events',
              'epic_09_analytics_once',
            ),
          });
        }
        return delegates.analyticsQueue.enqueueBounded(event, nowMs);
      },
      listDue: (nowMs, limit) => delegates.analyticsQueue.listDue(nowMs, limit),
      markRetry: (input) => delegates.analyticsQueue.markRetry(input),
      deleteDelivered: (eventIds) => delegates.analyticsQueue.deleteDelivered(eventIds),
      clear: () => delegates.analyticsQueue.clear(),
    },
    prepare: (dependencies) => prepareExitHistory(scenario, dependencies),
  };
};
