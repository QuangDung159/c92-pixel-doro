import {
  persistenceError,
  type ClockPort,
  type CompleteOnboardingTrialUseCase,
  type RewardReceiptRepository,
  type SessionRepository,
  type StartOnboardingTrialUseCase,
} from '@pixeldoro/application';
import type { InstallationRepository } from '@/application';

export type OnboardingTrialReviewScenario =
  | 'trial_start_failure'
  | 'trial_cancel_failure'
  | 'trial_running_fast_clock'
  | 'trial_deadline_pending'
  | 'trial_overdue_running'
  | 'trial_complete_race'
  | 'trial_reward_write_failure'
  | 'trial_completed_fresh'
  | 'trial_completed_reopen'
  | 'trial_continue_failure'
  | 'epic_05_fresh_end_to_end'
  | 'epic_05_exclusion_seed';

export interface OnboardingTrialReviewFixture {
  readonly scenario: OnboardingTrialReviewScenario;
  readonly clock: ClockPort;
  readonly sessions: SessionRepository;
  readonly rewards: RewardReceiptRepository;
  readonly installation?: InstallationRepository;
  readonly prepareForStartup?: (
    start: StartOnboardingTrialUseCase,
    complete: CompleteOnboardingTrialUseCase,
  ) => Promise<boolean>;
}

const scenarios: readonly OnboardingTrialReviewScenario[] = [
  'trial_start_failure',
  'trial_cancel_failure',
  'trial_running_fast_clock',
  'trial_deadline_pending',
  'trial_overdue_running',
  'trial_complete_race',
  'trial_reward_write_failure',
  'trial_completed_fresh',
  'trial_completed_reopen',
  'trial_continue_failure',
  'epic_05_fresh_end_to_end',
  'epic_05_exclusion_seed',
];

class OffsetReviewClock implements ClockPort {
  private offsetMs = 0;

  constructor(private readonly base: ClockPort) {}

  nowMs(): number {
    return this.base.nowMs() + this.offsetMs;
  }

  advanceBy(durationMs: number): void {
    this.offsetMs += durationMs;
  }
}

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

class ReviewRewardReceiptRepository implements RewardReceiptRepository {
  private failedOnce = false;

  constructor(
    private readonly delegate: RewardReceiptRepository,
    private readonly scenario: OnboardingTrialReviewScenario,
  ) {}

  findById: RewardReceiptRepository['findById'] = (id) => this.delegate.findById(id);
  findBySessionId: RewardReceiptRepository['findBySessionId'] = (sessionId) =>
    this.delegate.findBySessionId(sessionId);
  findBySessionIdInTransaction: RewardReceiptRepository['findBySessionIdInTransaction'] = (
    scope,
    sessionId,
  ) => this.delegate.findBySessionIdInTransaction(scope, sessionId);
  insertInTransaction: RewardReceiptRepository['insertInTransaction'] = (scope, record) => {
    if (this.scenario === 'trial_reward_write_failure' && !this.failedOnce) {
      this.failedOnce = true;
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'reward_transactions'),
      });
    }
    return this.delegate.insertInTransaction(scope, record);
  };
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

class ReviewInstallationRepository implements InstallationRepository {
  private failedOnce = false;

  constructor(private readonly delegate: InstallationRepository) {}

  find: InstallationRepository['find'] = () => this.delegate.find();
  setAnonymousAnalyticsId: InstallationRepository['setAnonymousAnalyticsId'] = (
    anonymousAnalyticsId,
    updatedAt,
  ) => this.delegate.setAnonymousAnalyticsId(anonymousAnalyticsId, updatedAt);
  setOnboardingCompleted: InstallationRepository['setOnboardingCompleted'] = (
    completedAt,
    updatedAt,
  ) => {
    if (!this.failedOnce) {
      this.failedOnce = true;
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'app_installation'),
      });
    }
    return this.delegate.setOnboardingCompleted(completedAt, updatedAt);
  };
}

export const createOnboardingTrialReviewFixture = (
  rawScenario: string | undefined,
  enabled: boolean,
  baseClock: ClockPort,
  sessions: SessionRepository,
  rewards: RewardReceiptRepository,
  installation?: InstallationRepository,
): OnboardingTrialReviewFixture | undefined => {
  if (!enabled || !scenarios.includes(rawScenario as OnboardingTrialReviewScenario)) {
    return undefined;
  }
  const scenario = rawScenario as OnboardingTrialReviewScenario;
  const factor = scenario === 'trial_running_fast_clock'
    ? 30
    : scenario === 'trial_deadline_pending' ||
        scenario === 'trial_complete_race' ||
        scenario === 'trial_reward_write_failure' ||
        scenario === 'epic_05_fresh_end_to_end'
      ? 1_000
      : 1;
  const overdueClock = scenario === 'trial_overdue_running' ||
    scenario === 'trial_completed_fresh' ||
    scenario === 'trial_completed_reopen' ||
    scenario === 'trial_continue_failure' ||
    scenario === 'epic_05_exclusion_seed'
    ? new OffsetReviewClock(baseClock)
    : undefined;
  return {
    scenario,
    clock: overdueClock ?? (factor === 1 ? baseClock : new AcceleratedReviewClock(baseClock, factor)),
    sessions: new ReviewSessionRepository(sessions, scenario),
    rewards: new ReviewRewardReceiptRepository(rewards, scenario),
    ...(scenario === 'trial_continue_failure' && installation !== undefined
      ? { installation: new ReviewInstallationRepository(installation) }
      : {}),
    ...(overdueClock === undefined ? {} : {
      prepareForStartup: async (
        start: StartOnboardingTrialUseCase,
        complete: CompleteOnboardingTrialUseCase,
      ) => {
          const result = await start.execute();
          if (!result.ok) return false;
          overdueClock.advanceBy(300_001);
          if (
            scenario === 'trial_completed_reopen' ||
            scenario === 'epic_05_exclusion_seed'
          ) {
            const completed = await complete.execute(result.value.session.id);
            return completed.ok &&
              (completed.value.outcome === 'completed_fresh' ||
                completed.value.outcome === 'already_completed');
          }
          return true;
        },
    }),
  };
};
