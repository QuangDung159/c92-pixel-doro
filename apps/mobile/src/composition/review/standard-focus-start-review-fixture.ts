import {
  persistenceError,
  type RunningSessionRecord,
  type SessionRepository,
} from '@pixeldoro/application';

export type StandardFocusStartReviewScenario =
  | 'standard_start_success'
  | 'standard_start_active_conflict'
  | 'standard_start_write_failure_once'
  | 'standard_start_committed_relaunch'
  | 'standard_start_read_failure';

export interface StandardFocusStartReviewFixture {
  readonly scenario: StandardFocusStartReviewScenario;
  readonly sessions: SessionRepository;
  readonly prepareCommittedRelaunch: boolean;
}

const scenarios = new Set<StandardFocusStartReviewScenario>([
  'standard_start_success',
  'standard_start_active_conflict',
  'standard_start_write_failure_once',
  'standard_start_committed_relaunch',
  'standard_start_read_failure',
]);

const conflictRecord: RunningSessionRecord = Object.freeze({
  id: 'epic-06-active-conflict',
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  status: 'running',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  startedAt: 1_788_336_000_000,
  endsAt: 1_788_337_500_000,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_788_336_000_000,
  updatedAt: 1_788_336_000_000,
});

const isScenario = (value: string): value is StandardFocusStartReviewScenario =>
  scenarios.has(value as StandardFocusStartReviewScenario);

const decorateSessions = (
  delegate: SessionRepository,
  scenario: StandardFocusStartReviewScenario,
): SessionRepository => {
  let failWrite = scenario === 'standard_start_write_failure_once';
  return {
    findById: (id) => delegate.findById(id),
    findActive: () => scenario === 'standard_start_read_failure'
      ? Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
        })
      : delegate.findActive(),
    findLatestOnboardingTrial: () => delegate.findLatestOnboardingTrial(),
    findByIdInTransaction: (scope, id) => delegate.findByIdInTransaction(scope, id),
    findActiveInTransaction: (scope) =>
      scenario === 'standard_start_active_conflict'
        ? Promise.resolve({ ok: true, value: conflictRecord })
        : delegate.findActiveInTransaction(scope),
    insertRunningInTransaction: (scope, record) => {
      if (failWrite) {
        failWrite = false;
        return Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions'),
        });
      }
      return delegate.insertRunningInTransaction(scope, record);
    },
    recordBackgroundedAtInTransaction: (scope, input) =>
      delegate.recordBackgroundedAtInTransaction(scope, input),
    transitionFromRunningInTransaction: (scope, input) =>
      delegate.transitionFromRunningInTransaction(scope, input),
  };
};

export const createStandardFocusStartReviewFixture = (
  value: string | undefined,
  enabled: boolean,
  sessions: SessionRepository,
): StandardFocusStartReviewFixture | undefined => {
  if (!enabled || value === undefined || !isScenario(value)) return undefined;
  return {
    scenario: value,
    sessions: decorateSessions(sessions, value),
    prepareCommittedRelaunch: value === 'standard_start_committed_relaunch',
  };
};
