import type { ProfileRepository } from '../persistence/profile.repository';
import type { RewardReceiptRepository } from '../persistence/reward-receipt.repository';
import type { SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import {
  ONBOARDING_TRIAL_COIN_REWARD,
  ONBOARDING_TRIAL_XP_REWARD,
  type OnboardingTrialCommittedResult,
} from './complete-onboarding-trial.use-case';
import { MVP_PROFILE_ID } from './onboarding-trial-record';

export type LoadOnboardingTrialResultOutcome =
  | { readonly outcome: 'ready'; readonly result: OnboardingTrialCommittedResult }
  | { readonly outcome: 'missing' };

export interface LoadOnboardingTrialResultError {
  readonly kind: 'load_onboarding_trial_result_error';
  readonly code: 'ONBOARDING_TRIAL_RESULT_READ_FAILED' | 'ONBOARDING_TRIAL_RESULT_INCONSISTENT';
}

export interface LoadOnboardingTrialResultDependencies {
  readonly profile: Pick<ProfileRepository, 'find'>;
  readonly rewards: Pick<RewardReceiptRepository, 'findBySessionId'>;
  readonly sessions: Pick<SessionRepository, 'findLatestOnboardingTrial'>;
}

const failure = (
  code: LoadOnboardingTrialResultError['code'],
): ApplicationResult<never, LoadOnboardingTrialResultError> => ({
  ok: false,
  error: { kind: 'load_onboarding_trial_result_error', code },
});

export class LoadOnboardingTrialResultUseCase {
  constructor(private readonly dependencies: LoadOnboardingTrialResultDependencies) {}

  async execute(): Promise<
    ApplicationResult<LoadOnboardingTrialResultOutcome, LoadOnboardingTrialResultError>
  > {
    try {
      const session = await this.dependencies.sessions.findLatestOnboardingTrial();
      if (!session.ok) return failure('ONBOARDING_TRIAL_RESULT_READ_FAILED');
      if (session.value === null || session.value.status !== 'completed') {
        return { ok: true, value: { outcome: 'missing' } };
      }
      const [receipt, profile] = await Promise.all([
        this.dependencies.rewards.findBySessionId(session.value.id),
        this.dependencies.profile.find(),
      ]);
      if (!receipt.ok || !profile.ok) return failure('ONBOARDING_TRIAL_RESULT_READ_FAILED');
      const row = session.value;
      if (
        receipt.value === null ||
        profile.value === null ||
        row.sessionType !== 'focus' ||
        row.focusVariant !== 'onboarding_trial' ||
        row.mode !== 'relax' ||
        row.workTag !== null ||
        row.configuredDurationMinutes !== 5 ||
        row.profileId !== MVP_PROFILE_ID ||
        row.resolvedAt === null ||
        row.rewardClaimedAt === null ||
        row.xpEarned !== ONBOARDING_TRIAL_XP_REWARD ||
        row.coinsEarned !== ONBOARDING_TRIAL_COIN_REWARD ||
        receipt.value.sessionId !== row.id ||
        receipt.value.profileId !== MVP_PROFILE_ID ||
        receipt.value.reason !== 'onboarding_trial_completed' ||
        receipt.value.xpDelta !== ONBOARDING_TRIAL_XP_REWARD ||
        receipt.value.coinDelta !== ONBOARDING_TRIAL_COIN_REWARD ||
        receipt.value.createdAt !== row.rewardClaimedAt ||
        profile.value.id !== MVP_PROFILE_ID
      ) return failure('ONBOARDING_TRIAL_RESULT_INCONSISTENT');

      return {
        ok: true,
        value: {
          outcome: 'ready',
          result: {
            sessionId: row.id,
            receiptId: receipt.value.id,
            resolvedAt: row.resolvedAt,
            xpEarned: ONBOARDING_TRIAL_XP_REWARD,
            coinsEarned: ONBOARDING_TRIAL_COIN_REWARD,
            totalXp: profile.value.totalXp,
            coinBalance: profile.value.coinBalance,
          },
        },
      };
    } catch {
      return failure('ONBOARDING_TRIAL_RESULT_READ_FAILED');
    }
  }
}
