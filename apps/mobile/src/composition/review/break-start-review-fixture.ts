import {
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
  persistenceError,
  type ClockPort,
  type IdPort,
  type ProfileRepository,
  type RewardReceiptRepository,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

export type BreakStartReviewScenario =
  | 'break_start_short'
  | 'break_start_long_due'
  | 'break_start_preview_changes'
  | 'break_start_write_failure_once'
  | 'break_start_active_conflict';

type BreakStartSessions = Pick<SessionRepository,
'findById' | 'findByIdInTransaction' | 'findActiveInTransaction' |
'insertRunningInTransaction' | 'transitionFromRunningInTransaction'>;

interface FixtureDependencies {
  readonly installation: {
    setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
  };
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

const scenarios = new Set<BreakStartReviewScenario>([
  'break_start_short',
  'break_start_long_due',
  'break_start_preview_changes',
  'break_start_write_failure_once',
  'break_start_active_conflict',
]);

export const resolveBreakStartReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): BreakStartReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as BreakStartReviewScenario)
    ? value as BreakStartReviewScenario
    : undefined;

export const breakStartReviewDatabaseName = (scenario: BreakStartReviewScenario): string =>
  `pixeldoro-us-07-02-${scenario}.db`;

const focusCountFor = (scenario: BreakStartReviewScenario): number =>
  scenario === 'break_start_long_due' || scenario === 'break_start_preview_changes' ? 4 : 1;

const fixedIds = (focusCount: number): IdPort => {
  const values = Array.from({ length: focusCount }, (_, index) => [
    `us0702-focus-${index + 1}`,
    `us0702-reward-${index + 1}`,
  ]).flat();
  let cursor = 0;
  return { nextId: () => values[cursor++] ?? `us0702-seed-${cursor}` };
};

const prepare = async (
  scenario: BreakStartReviewScenario,
  sourceSessionId: string,
  dependencies: FixtureDependencies,
): Promise<void> => {
  const existing = await dependencies.sessions.findById(sourceSessionId);
  if (!existing.ok) throw new Error('break_start_fixture_read_failed');
  if (existing.value !== null) return;
  const coordinator = new SessionCommandCoordinator();
  const id = fixedIds(focusCountFor(scenario) + 1);
  let time = 1_788_854_400_000;
  const clock: ClockPort = { nowMs: () => time };
  const calendar = { snapshot: () => ({
    ok: true as const,
    value: { localDate: '2026-09-09', utcOffsetMinutes: 420 },
  }) };

  await dependencies.installation.setOnboardingCompleted(time, time);
  for (let index = 0; index < focusCountFor(scenario); index += 1) {
    const started = await new StartStandardFocusUseCase({
      calendar, clock, coordinator, id,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
    if (!started.ok) throw new Error('break_start_fixture_focus_failed');
    time = started.value.session.endsAt;
    const completed = await new ReconcileStandardFocusUseCase({
      clock, coordinator, id,
      profile: dependencies.profile,
      rewards: dependencies.rewards,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute(started.value.session.id);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error('break_start_fixture_completion_failed');
    }
    time += 1_000;
  }

  if (scenario === 'break_start_active_conflict') {
    const active = await new StartStandardFocusUseCase({
      calendar, clock, coordinator, id,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'coding' });
    if (!active.ok) throw new Error('break_start_fixture_active_failed');
  }
};

export const createBreakStartReviewFixture = (
  scenario: BreakStartReviewScenario | undefined,
  delegate: SessionRepository,
) => {
  if (scenario === undefined) return undefined;
  let failWrite = scenario === 'break_start_write_failure_once';
  const sessions: BreakStartSessions = {
    findById: (id) => delegate.findById(id),
    findByIdInTransaction: (scope, id) => delegate.findByIdInTransaction(scope, id),
    findActiveInTransaction: (scope) => delegate.findActiveInTransaction(scope),
    insertRunningInTransaction: (scope, record) => {
      if (failWrite && (record.sessionType === 'short_break' || record.sessionType === 'long_break')) {
        failWrite = false;
        return Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions', 'review_once'),
        });
      }
      return delegate.insertRunningInTransaction(scope, record);
    },
    transitionFromRunningInTransaction: (scope, input) =>
      delegate.transitionFromRunningInTransaction(scope, input),
  };
  const sourceSessionId = `us0702-focus-${focusCountFor(scenario)}`;
  return {
    scenario,
    databaseName: breakStartReviewDatabaseName(scenario),
    sourceSessionId,
    sessions,
    prepare: (dependencies: FixtureDependencies) =>
      prepare(scenario, sourceSessionId, dependencies),
  };
};
