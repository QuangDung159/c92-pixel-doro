import {
  CancelStandardFocusUseCase,
  CompleteOnboardingTrialUseCase,
  ReconcileBreakUseCase,
  ReconcileStandardFocusUseCase,
  RecordStrictBackgroundUseCase,
  StartBreakUseCase,
  StartOnboardingTrialUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type LongBreakCadenceQuery,
  type ProfileRepository,
  type RewardReceiptRepository,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type StandardFocusHistoryQuery,
  type TransactionPort,
  type TransactionalLongBreakCadenceQuery,
} from '@pixeldoro/application';

export type HistoryFirstPageReviewScenario =
  | 'history_first_page_empty'
  | 'history_first_page_mixed'
  | 'history_first_page_read_failure_once'
  | 'history_first_page_corrupt';

const scenarios = new Set<HistoryFirstPageReviewScenario>([
  'history_first_page_empty',
  'history_first_page_mixed',
  'history_first_page_read_failure_once',
  'history_first_page_corrupt',
]);

export const resolveHistoryFirstPageReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): HistoryFirstPageReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as HistoryFirstPageReviewScenario)
    ? value as HistoryFirstPageReviewScenario
    : undefined;

export const historyFirstPageReviewDatabaseName = (
  scenario: HistoryFirstPageReviewScenario,
): string => `pixeldoro-us-09-01-${scenario}.db`;

export interface HistoryFirstPageReviewDependencies {
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly history: StandardFocusHistoryQuery;
  readonly installation: {
    setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
  };
  readonly longBreakCadence: LongBreakCadenceQuery & TransactionalLongBreakCadenceQuery;
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface HistoryFirstPageReviewFixture {
  readonly scenario: HistoryFirstPageReviewScenario;
  readonly databaseName: string;
  readonly history: StandardFocusHistoryQuery;
  prepare(dependencies: HistoryFirstPageReviewDependencies): Promise<boolean>;
}

const prepareMixedHistory = async (
  dependencies: HistoryFirstPageReviewDependencies,
): Promise<boolean> => {
  const existing = await dependencies.sessions.findById('us0901-standard-completed');
  if (!existing.ok) throw new Error('history_fixture_read_failed');
  if (existing.value !== null) return false;

  let now = 1_789_056_000_000;
  let sequence = 0;
  const clock = { nowMs: () => now };
  const id = { nextId: () => `us0901-fixture-${++sequence}` };
  const calendar = { snapshot: () => ({
    ok: true as const,
    value: { localDate: '2026-09-11', utcOffsetMinutes: 420 },
  }) };
  await dependencies.installation.setOnboardingCompleted(now, now);

  const completedStart = new StartStandardFocusUseCase({
    calendar,
    clock,
    coordinator: dependencies.coordinator,
    id: { nextId: () => 'us0901-standard-completed' },
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  });
  const completed = await completedStart.execute({
    durationMinutes: 25,
    mode: 'relax',
    workTag: 'coding',
  });
  if (!completed.ok) throw new Error('history_fixture_completed_start_failed');
  now = completed.value.session.endsAt;
  const completedResult = await new ReconcileStandardFocusUseCase({
    clock,
    coordinator: dependencies.coordinator,
    id,
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(completed.value.session.id);
  if (!completedResult.ok || completedResult.value.outcome !== 'completed') {
    throw new Error('history_fixture_completed_reconcile_failed');
  }

  now += 60_000;
  const breakStarted = await new StartBreakUseCase({
    calendar,
    clock,
    coordinator: dependencies.coordinator,
    id,
    longBreakCadence: dependencies.longBreakCadence,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute({ sourceFocusSessionId: completed.value.session.id });
  if (!breakStarted.ok) throw new Error('history_fixture_break_start_failed');
  now = breakStarted.value.session.endsAt;
  const breakCompleted = await new ReconcileBreakUseCase({
    clock,
    coordinator: dependencies.coordinator,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(breakStarted.value.session.id);
  if (!breakCompleted.ok || breakCompleted.value.outcome !== 'completed') {
    throw new Error('history_fixture_break_complete_failed');
  }

  now += 60_000;
  const trialStarted = await new StartOnboardingTrialUseCase({
    calendar,
    clock,
    coordinator: dependencies.coordinator,
    id,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute();
  if (!trialStarted.ok) throw new Error('history_fixture_trial_start_failed');
  now = trialStarted.value.session.endsAt;
  const trialCompleted = await new CompleteOnboardingTrialUseCase({
    clock,
    coordinator: dependencies.coordinator,
    id,
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(trialStarted.value.session.id);
  if (!trialCompleted.ok || trialCompleted.value.outcome !== 'completed_fresh') {
    throw new Error('history_fixture_trial_complete_failed');
  }

  now += 60_000;
  const failedStarted = await new StartStandardFocusUseCase({
    calendar,
    clock,
    coordinator: dependencies.coordinator,
    id: { nextId: () => 'us0901-standard-failed' },
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute({ durationMinutes: 25, mode: 'strict', workTag: 'study' });
  if (!failedStarted.ok) throw new Error('history_fixture_failed_start_failed');
  now += 1_000;
  const backgrounded = await new RecordStrictBackgroundUseCase({
    coordinator: dependencies.coordinator,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(now);
  if (!backgrounded.ok || backgrounded.value.outcome !== 'recorded') {
    throw new Error('history_fixture_background_failed');
  }
  now += 10_000;
  const failed = await new ReconcileStandardFocusUseCase({
    clock,
    coordinator: dependencies.coordinator,
    id,
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(failedStarted.value.session.id);
  if (!failed.ok || failed.value.outcome !== 'failed') {
    throw new Error('history_fixture_failed_reconcile_failed');
  }

  now = failedStarted.value.session.endsAt + 60_000;
  const cancelledStarted = await new StartStandardFocusUseCase({
    calendar,
    clock,
    coordinator: dependencies.coordinator,
    id: { nextId: () => 'us0901-standard-cancelled' },
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'writing' });
  if (!cancelledStarted.ok) throw new Error('history_fixture_cancelled_start_failed');
  now += 1_000;
  const cancelled = await new CancelStandardFocusUseCase({
    clock,
    coordinator: dependencies.coordinator,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(cancelledStarted.value.session.id);
  if (!cancelled.ok || cancelled.value.outcome !== 'cancelled') {
    throw new Error('history_fixture_cancel_failed');
  }
  return true;
};

export const createHistoryFirstPageReviewFixture = (
  scenario: HistoryFirstPageReviewScenario | undefined,
  delegate: StandardFocusHistoryQuery,
): HistoryFirstPageReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let failRead = scenario === 'history_first_page_read_failure_once';
  const history: StandardFocusHistoryQuery = {
    list: async (input) => {
      if (failRead) {
        failRead = false;
        return {
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'review_once'),
        };
      }
      const result = await delegate.list(input);
      if (!result.ok || scenario !== 'history_first_page_corrupt') return result;
      const first = result.value.entries[0];
      if (first === undefined) return result;
      return {
        ok: true,
        value: {
          entries: [
            { ...first, scheduledEndLocalDate: '2026-02-30' },
            ...result.value.entries.slice(1),
          ],
          nextCursor: result.value.nextCursor,
        },
      };
    },
  };
  return {
    scenario,
    databaseName: historyFirstPageReviewDatabaseName(scenario),
    history,
    prepare: (dependencies) => scenario === 'history_first_page_empty'
      ? Promise.resolve(false)
      : prepareMixedHistory(dependencies),
  };
};
