import {
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
  persistenceError,
  type ClockPort,
  type IdPort,
  type LongBreakCadenceQuery,
  type ProfileRepository,
  type RewardReceiptRepository,
  type RunningSessionRecord,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

export type BreakCadenceReviewScenario =
  | 'break_cadence_count_0'
  | 'break_cadence_count_3'
  | 'break_cadence_count_4'
  | 'break_cadence_due_sticky'
  | 'break_cadence_completed_long_reset'
  | 'break_cadence_cancelled_long_no_reset'
  | 'break_cadence_read_failure_once';

interface InstallationWriter {
  setOnboardingCompleted(
    completedAt: number,
    updatedAt: number,
  ): Promise<unknown>;
}

export interface BreakCadenceReviewFixtureDependencies {
  readonly installation: InstallationWriter;
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface BreakCadenceReviewFixture {
  readonly scenario: BreakCadenceReviewScenario;
  readonly databaseName: string;
  readonly longBreakCadence: LongBreakCadenceQuery;
  readonly sourceSessionId: string;
  prepare(dependencies: BreakCadenceReviewFixtureDependencies): Promise<void>;
}

const scenarios = new Set<BreakCadenceReviewScenario>([
  'break_cadence_count_0',
  'break_cadence_count_3',
  'break_cadence_count_4',
  'break_cadence_due_sticky',
  'break_cadence_completed_long_reset',
  'break_cadence_cancelled_long_no_reset',
  'break_cadence_read_failure_once',
]);

export const resolveBreakCadenceReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): BreakCadenceReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as BreakCadenceReviewScenario)
    ? value as BreakCadenceReviewScenario
    : undefined;

export const breakCadenceReviewDatabaseName = (
  scenario: BreakCadenceReviewScenario,
): string => `pixeldoro-us-07-01-${scenario}.db`;

const focusCountFor = (scenario: BreakCadenceReviewScenario): number => {
  if (scenario === 'break_cadence_count_0') return 1;
  if (scenario === 'break_cadence_count_3') return 3;
  if (
    scenario === 'break_cadence_count_4' ||
    scenario === 'break_cadence_completed_long_reset' ||
    scenario === 'break_cadence_cancelled_long_no_reset' ||
    scenario === 'break_cadence_read_failure_once'
  ) return 4;
  return 5;
};

const fixedIds = (focusCount: number): IdPort => {
  const values = Array.from({ length: focusCount }, (_, index) => [
    `us0701-focus-${index + 1}`,
    `us0701-reward-${index + 1}`,
  ]).flat();
  let cursor = 0;
  return { nextId: () => values[cursor++] ?? `us0701-unexpected-${cursor}` };
};

const seedLongBreak = async (
  dependencies: BreakCadenceReviewFixtureDependencies,
  status: 'completed' | 'cancelled',
  startedAt: number,
): Promise<void> => {
  const endsAt = startedAt + 15 * 60_000;
  const resolvedAt = status === 'completed' ? endsAt : startedAt + 1_000;
  const record: RunningSessionRecord = {
    id: `us0701-long-${status}`,
    profileId: 1,
    sessionType: 'long_break',
    focusVariant: null,
    mode: null,
    status: 'running',
    workTag: null,
    configuredDurationMinutes: 15,
    startedAt,
    endsAt,
    backgroundedAt: null,
    resolvedAt: null,
    xpEarned: 0,
    coinsEarned: 0,
    rewardClaimedAt: null,
    scheduledEndLocalDate: '2026-09-08',
    scheduledEndUtcOffsetMinutes: 420,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
  const seeded = await dependencies.transaction.execute(async (scope) => {
    const inserted = await dependencies.sessions.insertRunningInTransaction(scope, record);
    if (!inserted.ok) return inserted;
    const transitioned = await dependencies.sessions.transitionFromRunningInTransaction(
      scope,
      {
        sessionId: record.id,
        status,
        resolvedAt,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        updatedAt: resolvedAt,
      },
    );
    if (!transitioned.ok) return transitioned;
    return { ok: true as const, value: undefined };
  });
  if (!seeded.ok) throw new Error('break_cadence_long_seed_failed');
};

const prepareScenario = async (
  scenario: BreakCadenceReviewScenario,
  sourceSessionId: string,
  dependencies: BreakCadenceReviewFixtureDependencies,
): Promise<void> => {
  const existing = await dependencies.sessions.findById(sourceSessionId);
  if (!existing.ok) throw new Error('break_cadence_fixture_read_failed');
  if (existing.value !== null) return;

  const focusCount = focusCountFor(scenario);
  const coordinator = new SessionCommandCoordinator();
  const id = fixedIds(focusCount);
  let now = 1_788_768_000_000;
  const clock: ClockPort = { nowMs: () => now };
  const calendar = {
    snapshot: () => ({
      ok: true as const,
      value: { localDate: '2026-09-08', utcOffsetMinutes: 420 },
    }),
  };

  await dependencies.installation.setOnboardingCompleted(now, now);
  for (let index = 0; index < focusCount; index += 1) {
    const started = await new StartStandardFocusUseCase({
      calendar,
      clock,
      coordinator,
      id,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
    if (!started.ok) throw new Error('break_cadence_focus_seed_start_failed');
    now = started.value.session.endsAt;
    const completed = await new ReconcileStandardFocusUseCase({
      clock,
      coordinator,
      id,
      sessions: dependencies.sessions,
      profile: dependencies.profile,
      rewards: dependencies.rewards,
      transaction: dependencies.transaction,
    }).execute(started.value.session.id);
    if (!completed.ok || completed.value.outcome !== 'completed') {
      throw new Error('break_cadence_focus_seed_completion_failed');
    }
    now += 1_000;
  }

  if (
    scenario === 'break_cadence_count_0' ||
    scenario === 'break_cadence_completed_long_reset'
  ) {
    await seedLongBreak(dependencies, 'completed', now);
  } else if (scenario === 'break_cadence_cancelled_long_no_reset') {
    await seedLongBreak(dependencies, 'cancelled', now);
  }
};

export const createBreakCadenceReviewFixture = (
  scenario: BreakCadenceReviewScenario | undefined,
  delegate: LongBreakCadenceQuery,
): BreakCadenceReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  const sourceSessionId = `us0701-focus-${focusCountFor(scenario)}`;
  let failRead = scenario === 'break_cadence_read_failure_once';
  const longBreakCadence: LongBreakCadenceQuery = {
    getFacts: (profileId) => {
      if (failRead) {
        failRead = false;
        return Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'cadence'),
        });
      }
      return delegate.getFacts(profileId);
    },
  };
  return {
    scenario,
    databaseName: breakCadenceReviewDatabaseName(scenario),
    longBreakCadence,
    sourceSessionId,
    prepare: (dependencies) => prepareScenario(
      scenario,
      sourceSessionId,
      dependencies,
    ),
  };
};
