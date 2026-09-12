import {
  CancelStandardFocusUseCase,
  ReconcileStandardFocusUseCase,
  RecordStrictBackgroundUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type ProfileRepository,
  type RewardReceiptRepository,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type StandardFocusHistoryEntry,
  type StandardFocusHistoryQuery,
  type TransactionPort,
} from '@pixeldoro/application';

export type HistoryGroupedReviewScenario =
  | 'history_grouped_21'
  | 'history_equal_end_boundary'
  | 'history_load_more_failure_once'
  | 'history_refresh_failure_once'
  | 'history_new_terminal_on_refresh';

const scenarios = new Set<HistoryGroupedReviewScenario>([
  'history_grouped_21',
  'history_equal_end_boundary',
  'history_load_more_failure_once',
  'history_refresh_failure_once',
  'history_new_terminal_on_refresh',
]);

export const resolveHistoryGroupedReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): HistoryGroupedReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as HistoryGroupedReviewScenario)
    ? value as HistoryGroupedReviewScenario
    : undefined;

export const historyGroupedReviewDatabaseName = (
  scenario: HistoryGroupedReviewScenario,
): string => `pixeldoro-us-09-02-${scenario}.db`;

export interface HistoryGroupedReviewDependencies {
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly installation: {
    setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
  };
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface HistoryGroupedReviewFixture {
  readonly scenario: HistoryGroupedReviewScenario;
  readonly databaseName: string;
  readonly history: StandardFocusHistoryQuery;
  prepare(dependencies: HistoryGroupedReviewDependencies): Promise<boolean>;
}

const localDateFor = (index: number): string => index < 7
  ? '2026-09-09'
  : index < 14 ? '2026-09-10' : '2026-09-11';

const prepareGroupedHistory = async (
  dependencies: HistoryGroupedReviewDependencies,
): Promise<boolean> => {
  const newestId = 'us0902-history-20';
  const existing = await dependencies.sessions.findById(newestId);
  if (!existing.ok) throw new Error('history_grouped_fixture_read_failed');
  if (existing.value !== null) return false;

  let now = 1_789_056_000_000;
  let rewardSequence = 0;
  const clock = { nowMs: () => now };
  const rewardId = { nextId: () => `us0902-reward-${++rewardSequence}` };
  await dependencies.installation.setOnboardingCompleted(now, now);

  for (let index = 0; index < 21; index += 1) {
    const sessionId = `us0902-history-${String(index).padStart(2, '0')}`;
    const calendar = { snapshot: () => ({
      ok: true as const,
      value: {
        localDate: localDateFor(index),
        utcOffsetMinutes: 420,
      },
    }) };
    const isFailed = index === 8;
    const isCancelled = index % 5 === 0;
    const started = await new StartStandardFocusUseCase({
      calendar,
      clock,
      coordinator: dependencies.coordinator,
      id: { nextId: () => sessionId },
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({
      durationMinutes: index % 2 === 0 ? 25 : 15,
      mode: isFailed ? 'strict' : 'relax',
      workTag: index % 3 === 0 ? 'writing' : index % 3 === 1 ? 'study' : 'coding',
    });
    if (!started.ok) throw new Error(`history_grouped_fixture_start_failed_${index}`);

    if (isFailed) {
      now += 1_000;
      const backgrounded = await new RecordStrictBackgroundUseCase({
        coordinator: dependencies.coordinator,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(now);
      if (!backgrounded.ok || backgrounded.value.outcome !== 'recorded') {
        throw new Error('history_grouped_fixture_background_failed');
      }
      now += 10_000;
      const failed = await new ReconcileStandardFocusUseCase({
        clock,
        coordinator: dependencies.coordinator,
        id: rewardId,
        profile: dependencies.profile,
        rewards: dependencies.rewards,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(sessionId);
      if (!failed.ok || failed.value.outcome !== 'failed') {
        throw new Error('history_grouped_fixture_failure_failed');
      }
      now = started.value.session.endsAt + 60_000;
      continue;
    }

    if (isCancelled) {
      now += 1_000;
      const cancelled = await new CancelStandardFocusUseCase({
        clock,
        coordinator: dependencies.coordinator,
        sessions: dependencies.sessions,
        transaction: dependencies.transaction,
      }).execute(sessionId);
      if (!cancelled.ok || cancelled.value.outcome !== 'cancelled') {
        throw new Error(`history_grouped_fixture_cancel_failed_${index}`);
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
      throw new Error(`history_grouped_fixture_complete_failed_${index}`);
    }
    now += 60_000;
  }
  return true;
};

const isAfter = (
  entry: StandardFocusHistoryEntry,
  cursor: { readonly endsAt: number; readonly id: string },
): boolean => entry.endsAt < cursor.endsAt ||
  (entry.endsAt === cursor.endsAt && entry.id > cursor.id);

const createEqualBoundaryQuery = (
  delegate: StandardFocusHistoryQuery,
): StandardFocusHistoryQuery => ({
  list: async (input) => {
    const all = await delegate.list({ profileId: input.profileId, limit: 100, cursor: null });
    if (!all.ok) return all;
    const source = [...all.value.entries];
    const left = source[19];
    const right = source[20];
    if (left === undefined || right === undefined) {
      return {
        ok: false,
        error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', 'sessions', 'review_count'),
      };
    }
    const tiedEnd = left.endsAt;
    source[20] = {
      ...right,
      startedAt: tiedEnd - right.configuredDurationMinutes * 60_000,
      endsAt: tiedEnd,
    };
    source.sort((a, b) => b.endsAt - a.endsAt || a.id.localeCompare(b.id));
    const afterCursor = input.cursor === null
      ? source
      : source.filter((entry) => isAfter(entry, input.cursor!));
    const entries = afterCursor.slice(0, input.limit);
    const last = entries.at(-1);
    return {
      ok: true,
      value: {
        entries,
        nextCursor: afterCursor.length > input.limit && last !== undefined
          ? { endsAt: last.endsAt, id: last.id }
          : null,
      },
    };
  },
});

export const createHistoryGroupedReviewFixture = (
  scenario: HistoryGroupedReviewScenario | undefined,
  delegate: StandardFocusHistoryQuery,
): HistoryGroupedReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let appendFailed = false;
  let nullReads = 0;
  const history = scenario === 'history_equal_end_boundary'
    ? createEqualBoundaryQuery(delegate)
    : {
        list: async (input: Parameters<StandardFocusHistoryQuery['list']>[0]) => {
          if (input.cursor === null) nullReads += 1;
          if (
            scenario === 'history_load_more_failure_once' && input.cursor !== null &&
            !appendFailed
          ) {
            appendFailed = true;
            return {
              ok: false as const,
              error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'review_append_once'),
            };
          }
          if (scenario === 'history_refresh_failure_once' && nullReads === 2) {
            return {
              ok: false as const,
              error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'review_refresh_once'),
            };
          }
          if (scenario === 'history_new_terminal_on_refresh' && nullReads === 1) {
            const result = await delegate.list({ ...input, limit: input.limit + 1 });
            if (!result.ok) return result;
            const visible = result.value.entries.filter((entry) => entry.id !== 'us0902-history-20');
            const entries = visible.slice(0, input.limit);
            const last = entries.at(-1);
            return {
              ok: true as const,
              value: {
                entries,
                nextCursor: visible.length > input.limit && last !== undefined
                  ? { endsAt: last.endsAt, id: last.id }
                  : null,
              },
            };
          }
          return delegate.list(input);
        },
      } satisfies StandardFocusHistoryQuery;
  return {
    scenario,
    databaseName: historyGroupedReviewDatabaseName(scenario),
    history,
    prepare: prepareGroupedHistory,
  };
};
