import {
  persistenceError,
  type ClockPort,
  type SessionRepository,
} from '@pixeldoro/application';

export type OnboardingTrialReviewScenario =
  | 'trial_start_failure'
  | 'trial_cancel_failure'
  | 'trial_running_fast_clock'
  | 'trial_deadline_pending';

export interface OnboardingTrialReviewFixture {
  readonly scenario: OnboardingTrialReviewScenario;
  readonly clock: ClockPort;
  readonly sessions: SessionRepository;
}

const scenarios: readonly OnboardingTrialReviewScenario[] = [
  'trial_start_failure',
  'trial_cancel_failure',
  'trial_running_fast_clock',
  'trial_deadline_pending',
];

class AcceleratedReviewClock implements ClockPort {
  private readonly realAnchor: number;
  private readonly virtualAnchor: number;

  constructor(
    private readonly base: ClockPort,
    private readonly factor: number,
  ) {
    this.realAnchor = base.nowMs();
    this.virtualAnchor = this.realAnchor;
  }

  nowMs(): number {
    return Math.floor(
      this.virtualAnchor + (this.base.nowMs() - this.realAnchor) * this.factor,
    );
  }
}

class ReviewSessionRepository implements SessionRepository {
  constructor(
    private readonly delegate: SessionRepository,
    private readonly scenario: OnboardingTrialReviewScenario,
  ) {}

  findById: SessionRepository['findById'] = (id) => this.delegate.findById(id);
  findActive: SessionRepository['findActive'] = () => this.delegate.findActive();
  findLatestOnboardingTrial: SessionRepository['findLatestOnboardingTrial'] = () =>
    this.delegate.findLatestOnboardingTrial();
  findByIdInTransaction: SessionRepository['findByIdInTransaction'] = (scope, id) =>
    this.delegate.findByIdInTransaction(scope, id);
  findActiveInTransaction: SessionRepository['findActiveInTransaction'] = (scope) =>
    this.delegate.findActiveInTransaction(scope);
  insertRunningInTransaction: SessionRepository['insertRunningInTransaction'] = (scope, record) =>
    this.scenario === 'trial_start_failure'
      ? Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions'),
        })
      : this.delegate.insertRunningInTransaction(scope, record);
  recordBackgroundedAtInTransaction: SessionRepository['recordBackgroundedAtInTransaction'] = (
    scope,
    input,
  ) => this.delegate.recordBackgroundedAtInTransaction(scope, input);
  transitionFromRunningInTransaction: SessionRepository['transitionFromRunningInTransaction'] = (
    scope,
    input,
  ) =>
    this.scenario === 'trial_cancel_failure'
      ? Promise.resolve({
          ok: false,
          error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions'),
        })
      : this.delegate.transitionFromRunningInTransaction(scope, input);
}

export const createOnboardingTrialReviewFixture = (
  rawScenario: string | undefined,
  enabled: boolean,
  baseClock: ClockPort,
  sessions: SessionRepository,
): OnboardingTrialReviewFixture | undefined => {
  if (!enabled || !scenarios.includes(rawScenario as OnboardingTrialReviewScenario)) {
    return undefined;
  }
  const scenario = rawScenario as OnboardingTrialReviewScenario;
  const factor = scenario === 'trial_running_fast_clock'
    ? 30
    : scenario === 'trial_deadline_pending'
      ? 1_000
      : 1;
  return {
    scenario,
    clock: factor === 1 ? baseClock : new AcceleratedReviewClock(baseClock, factor),
    sessions: new ReviewSessionRepository(sessions, scenario),
  };
};
