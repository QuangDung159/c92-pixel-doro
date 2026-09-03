import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { ProfileRecord, ProfileRepository } from '../persistence/profile.repository';
import type {
  RewardReceiptRecord,
  RewardReceiptRepository,
} from '../persistence/reward-receipt.repository';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import {
  isRunningOnboardingTrial,
  MVP_PROFILE_ID,
} from './onboarding-trial-record';
import type { SessionCommandCoordinatorPort } from './session-command.coordinator';

export const ONBOARDING_TRIAL_XP_REWARD = 5;
export const ONBOARDING_TRIAL_COIN_REWARD = 1;

export interface OnboardingTrialCommittedResult {
  readonly sessionId: string;
  readonly receiptId: string;
  readonly resolvedAt: number;
  readonly xpEarned: 5;
  readonly coinsEarned: 1;
  readonly totalXp: number;
  readonly coinBalance: number;
}

export interface OnboardingTrialFreshCompletionEvent {
  readonly eventId: string;
  readonly sessionId: string;
  readonly receiptId: string;
  readonly resolvedAt: number;
  readonly xpEarned: 5;
  readonly coinsEarned: 1;
}

export type CompleteOnboardingTrialOutcome =
  | {
      readonly outcome: 'completed_fresh';
      readonly result: OnboardingTrialCommittedResult;
      readonly event: OnboardingTrialFreshCompletionEvent;
    }
  | {
      readonly outcome: 'already_completed';
      readonly result: OnboardingTrialCommittedResult;
    }
  | { readonly outcome: 'still_running'; readonly sessionId: string; readonly endsAt: number }
  | { readonly outcome: 'no_active' }
  | { readonly outcome: 'already_terminal'; readonly sessionId: string; readonly status: 'cancelled' }
  | { readonly outcome: 'not_applicable'; readonly sessionId: string };

export type CompleteOnboardingTrialErrorCode =
  | 'SESSION_COMPLETION_TIME_INVALID'
  | 'SESSION_COMPLETION_READ_FAILED'
  | 'SESSION_COMPLETION_INVARIANT_FAILED'
  | 'SESSION_COMPLETION_WRITE_FAILED'
  | 'SESSION_COMPLETION_TRANSACTION_FAILED';

export interface CompleteOnboardingTrialError {
  readonly kind: 'complete_onboarding_trial_error';
  readonly code: CompleteOnboardingTrialErrorCode;
}

export interface CompleteOnboardingTrialDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly profile: Pick<
    ProfileRepository,
    'findInTransaction' | 'applyProgressionInTransaction'
  >;
  readonly rewards: Pick<
    RewardReceiptRepository,
    'findBySessionIdInTransaction' | 'insertInTransaction'
  >;
  readonly sessions: Pick<
    SessionRepository,
    | 'findActiveInTransaction'
    | 'findByIdInTransaction'
    | 'transitionFromRunningInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: CompleteOnboardingTrialErrorCode,
): ApplicationResult<never, CompleteOnboardingTrialError> => ({
  ok: false,
  error: { kind: 'complete_onboarding_trial_error', code },
});

const isCompletedTrial = (session: SessionRecord): boolean =>
  session.sessionType === 'focus' &&
  session.focusVariant === 'onboarding_trial' &&
  session.mode === 'relax' &&
  session.workTag === null &&
  session.configuredDurationMinutes === 5 &&
  session.profileId === MVP_PROFILE_ID &&
  session.status === 'completed' &&
  session.resolvedAt !== null &&
  session.rewardClaimedAt !== null &&
  session.xpEarned === ONBOARDING_TRIAL_XP_REWARD &&
  session.coinsEarned === ONBOARDING_TRIAL_COIN_REWARD;

const committedResult = (
  session: SessionRecord,
  receipt: RewardReceiptRecord,
  profile: ProfileRecord,
): OnboardingTrialCommittedResult | null => {
  if (
    !isCompletedTrial(session) ||
    receipt.sessionId !== session.id ||
    receipt.profileId !== MVP_PROFILE_ID ||
    receipt.reason !== 'onboarding_trial_completed' ||
    receipt.xpDelta !== ONBOARDING_TRIAL_XP_REWARD ||
    receipt.coinDelta !== ONBOARDING_TRIAL_COIN_REWARD ||
    receipt.createdAt !== session.rewardClaimedAt ||
    profile.id !== MVP_PROFILE_ID ||
    session.resolvedAt === null
  ) return null;

  return Object.freeze({
    sessionId: session.id,
    receiptId: receipt.id,
    resolvedAt: session.resolvedAt,
    xpEarned: ONBOARDING_TRIAL_XP_REWARD,
    coinsEarned: ONBOARDING_TRIAL_COIN_REWARD,
    totalXp: profile.totalXp,
    coinBalance: profile.coinBalance,
  });
};

export class CompleteOnboardingTrialUseCase {
  constructor(private readonly dependencies: CompleteOnboardingTrialDependencies) {}

  execute(
    sessionId?: string,
  ): Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>> {
    return this.dependencies.coordinator.run(async () => {
      const now = this.dependencies.clock.nowMs();
      if (!Number.isSafeInteger(now) || now < 0) {
        return failure('SESSION_COMPLETION_TIME_INVALID');
      }
      const transactionResult = await this.dependencies.transaction.execute<
        CompleteOnboardingTrialOutcome,
        CompleteOnboardingTrialError
      >(async (scope) => {
        const found = sessionId === undefined
          ? await this.dependencies.sessions.findActiveInTransaction(scope)
          : await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
        if (!found.ok) return failure('SESSION_COMPLETION_READ_FAILED');
        if (found.value === null) return { ok: true, value: { outcome: 'no_active' } };

        const session = found.value;
        if (session.status !== 'running') {
          if (session.status === 'cancelled') {
            return {
              ok: true,
              value: { outcome: 'already_terminal', sessionId: session.id, status: 'cancelled' },
            };
          }
          if (session.status !== 'completed' || !isCompletedTrial(session)) {
            return failure('SESSION_COMPLETION_INVARIANT_FAILED');
          }
          return this.loadCommitted(scope, session, 'already_completed');
        }

        if (session.focusVariant !== 'onboarding_trial') {
          return { ok: true, value: { outcome: 'not_applicable', sessionId: session.id } };
        }
        if (!isRunningOnboardingTrial(session)) {
          return failure('SESSION_COMPLETION_INVARIANT_FAILED');
        }
        if (now < session.endsAt) {
          return {
            ok: true,
            value: { outcome: 'still_running', sessionId: session.id, endsAt: session.endsAt },
          };
        }

        const receiptId = this.dependencies.id.nextId();
        if (receiptId.length === 0) return failure('SESSION_COMPLETION_INVARIANT_FAILED');

        const profileBefore = await this.dependencies.profile.findInTransaction(scope);
        if (!profileBefore.ok) return failure('SESSION_COMPLETION_READ_FAILED');
        if (profileBefore.value === null || profileBefore.value.id !== MVP_PROFILE_ID) {
          return failure('SESSION_COMPLETION_INVARIANT_FAILED');
        }

        const transitioned = await this.dependencies.sessions.transitionFromRunningInTransaction(
          scope,
          {
            sessionId: session.id,
            status: 'completed',
            resolvedAt: now,
            xpEarned: ONBOARDING_TRIAL_XP_REWARD,
            coinsEarned: ONBOARDING_TRIAL_COIN_REWARD,
            rewardClaimedAt: now,
            updatedAt: now,
          },
        );
        if (!transitioned.ok) return failure('SESSION_COMPLETION_WRITE_FAILED');
        if (transitioned.value !== 'updated') {
          const winner = await this.dependencies.sessions.findByIdInTransaction(scope, session.id);
          if (!winner.ok || winner.value === null) return failure('SESSION_COMPLETION_READ_FAILED');
          if (winner.value.status === 'cancelled') {
            return {
              ok: true,
              value: { outcome: 'already_terminal', sessionId: session.id, status: 'cancelled' },
            };
          }
          return this.loadCommitted(scope, winner.value, 'already_completed');
        }

        const receipt: RewardReceiptRecord = Object.freeze({
          id: receiptId,
          sessionId: session.id,
          profileId: MVP_PROFILE_ID,
          xpDelta: ONBOARDING_TRIAL_XP_REWARD,
          coinDelta: ONBOARDING_TRIAL_COIN_REWARD,
          reason: 'onboarding_trial_completed',
          createdAt: now,
        });
        const inserted = await this.dependencies.rewards.insertInTransaction(scope, receipt);
        if (!inserted.ok) return failure('SESSION_COMPLETION_WRITE_FAILED');

        const progressed = await this.dependencies.profile.applyProgressionInTransaction(scope, {
          profileId: MVP_PROFILE_ID,
          xpDelta: ONBOARDING_TRIAL_XP_REWARD,
          coinDelta: ONBOARDING_TRIAL_COIN_REWARD,
          updatedAt: now,
        });
        if (!progressed.ok || progressed.value !== 'updated') {
          return failure('SESSION_COMPLETION_WRITE_FAILED');
        }
        const profileAfter = await this.dependencies.profile.findInTransaction(scope);
        if (!profileAfter.ok || profileAfter.value === null) {
          return failure('SESSION_COMPLETION_READ_FAILED');
        }
        const completedSession: SessionRecord = {
          ...session,
          status: 'completed',
          resolvedAt: now,
          xpEarned: ONBOARDING_TRIAL_XP_REWARD,
          coinsEarned: ONBOARDING_TRIAL_COIN_REWARD,
          rewardClaimedAt: now,
          updatedAt: now,
        };
        const result = committedResult(completedSession, receipt, profileAfter.value);
        if (result === null) return failure('SESSION_COMPLETION_INVARIANT_FAILED');
        return {
          ok: true,
          value: {
            outcome: 'completed_fresh',
            result,
            event: {
              eventId: receipt.id,
              sessionId: session.id,
              receiptId: receipt.id,
              resolvedAt: now,
              xpEarned: ONBOARDING_TRIAL_XP_REWARD,
              coinsEarned: ONBOARDING_TRIAL_COIN_REWARD,
            },
          },
        };
      });

      if (!transactionResult.ok) {
        return transactionResult.error.kind === 'transaction_technical_error'
          ? failure('SESSION_COMPLETION_TRANSACTION_FAILED')
          : { ok: false, error: transactionResult.error };
      }
      return { ok: true, value: transactionResult.value };
    });
  }

  private async loadCommitted(
    scope: Parameters<RewardReceiptRepository['findBySessionIdInTransaction']>[0],
    session: SessionRecord,
    outcome: 'already_completed',
  ): Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>> {
    const receipt = await this.dependencies.rewards.findBySessionIdInTransaction(scope, session.id);
    const profile = await this.dependencies.profile.findInTransaction(scope);
    if (!receipt.ok || !profile.ok) return failure('SESSION_COMPLETION_READ_FAILED');
    if (receipt.value === null || profile.value === null) {
      return failure('SESSION_COMPLETION_INVARIANT_FAILED');
    }
    const result = committedResult(session, receipt.value, profile.value);
    return result === null
      ? failure('SESSION_COMPLETION_INVARIANT_FAILED')
      : { ok: true, value: { outcome, result } };
  }
}
