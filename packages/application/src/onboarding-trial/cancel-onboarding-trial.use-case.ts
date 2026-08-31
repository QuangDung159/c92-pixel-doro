import type { ClockPort } from '../ports/clock.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isRunningOnboardingTrial } from './onboarding-trial-record';
import type { SessionCommandCoordinatorPort } from './session-command.coordinator';

export type CancelOnboardingTrialOutcome =
  | { readonly outcome: 'cancelled'; readonly sessionId: string }
  | { readonly outcome: 'already_cancelled'; readonly sessionId: string };

export type CancelOnboardingTrialErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_ONBOARDING_TRIAL'
  | 'SESSION_DEADLINE_REACHED'
  | 'SESSION_ALREADY_TERMINAL'
  | 'SESSION_CANCEL_READ_FAILED'
  | 'SESSION_CANCEL_WRITE_FAILED'
  | 'SESSION_CANCEL_TRANSACTION_FAILED';

export interface CancelOnboardingTrialError {
  readonly kind: 'cancel_onboarding_trial_error';
  readonly code: CancelOnboardingTrialErrorCode;
}

export interface CancelOnboardingTrialDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: Pick<
    SessionRepository,
    'findByIdInTransaction' | 'transitionFromRunningInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: CancelOnboardingTrialErrorCode,
): ApplicationResult<never, CancelOnboardingTrialError> => ({
  ok: false,
  error: { kind: 'cancel_onboarding_trial_error', code },
});

const classifyTerminal = (
  session: SessionRecord,
): ApplicationResult<CancelOnboardingTrialOutcome, CancelOnboardingTrialError> => {
  if (session.focusVariant !== 'onboarding_trial') {
    return failure('SESSION_NOT_ONBOARDING_TRIAL');
  }
  if (session.status === 'cancelled') {
    return { ok: true, value: { outcome: 'already_cancelled', sessionId: session.id } };
  }
  return failure('SESSION_ALREADY_TERMINAL');
};

export class CancelOnboardingTrialUseCase {
  constructor(private readonly dependencies: CancelOnboardingTrialDependencies) {}

  execute(
    sessionId: string,
  ): Promise<ApplicationResult<CancelOnboardingTrialOutcome, CancelOnboardingTrialError>> {
    return this.dependencies.coordinator.run(async () => {
      const now = this.dependencies.clock.nowMs();
      if (!Number.isSafeInteger(now) || now < 0) {
        return failure('SESSION_CANCEL_TRANSACTION_FAILED');
      }

      const result = await this.dependencies.transaction.execute<
        CancelOnboardingTrialOutcome,
        CancelOnboardingTrialError
      >(async (scope) => {
        const found = await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
        if (!found.ok) return failure('SESSION_CANCEL_READ_FAILED');
        if (found.value === null) return failure('SESSION_NOT_FOUND');
        if (found.value.status !== 'running') return classifyTerminal(found.value);
        if (!isRunningOnboardingTrial(found.value)) {
          return failure('SESSION_NOT_ONBOARDING_TRIAL');
        }
        if (now >= found.value.endsAt) return failure('SESSION_DEADLINE_REACHED');

        const transitioned = await this.dependencies.sessions.transitionFromRunningInTransaction(
          scope,
          {
            sessionId,
            status: 'cancelled',
            resolvedAt: now,
            xpEarned: 0,
            coinsEarned: 0,
            rewardClaimedAt: null,
            updatedAt: now,
          },
        );
        if (!transitioned.ok) return failure('SESSION_CANCEL_WRITE_FAILED');
        if (transitioned.value === 'updated') {
          return { ok: true, value: { outcome: 'cancelled', sessionId } };
        }

        const winner = await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
        if (!winner.ok) return failure('SESSION_CANCEL_READ_FAILED');
        if (winner.value === null) return failure('SESSION_NOT_FOUND');
        return classifyTerminal(winner.value);
      });

      if (!result.ok) {
        return result.error.kind === 'transaction_technical_error'
          ? failure('SESSION_CANCEL_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
      }
      return { ok: true, value: result.value };
    });
  }
}
