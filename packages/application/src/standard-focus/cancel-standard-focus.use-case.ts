import { validateStandardFocusConfiguration } from '@pixeldoro/domain';
import { isRunningStandardFocus } from './standard-focus-record';

import type { ClockPort } from '../ports/clock.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';

export type CancelStandardFocusOutcome =
  | { readonly outcome: 'cancelled'; readonly sessionId: string }
  | { readonly outcome: 'already_cancelled'; readonly sessionId: string };

export type CancelStandardFocusErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_STANDARD_FOCUS'
  | 'SESSION_MODE_NOT_OWNED'
  | 'SESSION_DEADLINE_REACHED'
  | 'SESSION_ALREADY_TERMINAL'
  | 'SESSION_CANCEL_READ_FAILED'
  | 'SESSION_CANCEL_WRITE_FAILED'
  | 'SESSION_CANCEL_TRANSACTION_FAILED';

export interface CancelStandardFocusError {
  readonly kind: 'cancel_standard_focus_error';
  readonly code: CancelStandardFocusErrorCode;
}

export interface CancelStandardFocusDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: Pick<
    SessionRepository,
    'findByIdInTransaction' | 'transitionFromRunningInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: CancelStandardFocusErrorCode,
): ApplicationResult<never, CancelStandardFocusError> => ({
  ok: false,
  error: { kind: 'cancel_standard_focus_error', code },
});

const classifyIdentity = (
  session: SessionRecord,
): ApplicationResult<SessionRecord, CancelStandardFocusError> => {
  if (session.sessionType !== 'focus' || session.focusVariant !== 'standard') {
    return failure('SESSION_NOT_STANDARD_FOCUS');
  }
  if (session.mode !== 'relax') return failure('SESSION_MODE_NOT_OWNED');
  if (
    session.workTag === null ||
    !validateStandardFocusConfiguration({
      durationMinutes: session.configuredDurationMinutes,
      mode: session.mode,
      workTag: session.workTag,
    }).ok
  ) return failure('SESSION_NOT_STANDARD_FOCUS');
  if (session.status === 'running' && !isRunningStandardFocus(session)) {
    return failure('SESSION_NOT_STANDARD_FOCUS');
  }
  return { ok: true, value: session };
};

const classifyTerminal = (
  session: SessionRecord,
): ApplicationResult<CancelStandardFocusOutcome, CancelStandardFocusError> => {
  const identity = classifyIdentity(session);
  if (!identity.ok) return identity;
  if (
    session.status === 'cancelled' &&
    session.resolvedAt !== null &&
    Number.isSafeInteger(session.resolvedAt) &&
    session.resolvedAt >= session.startedAt &&
    session.resolvedAt < session.endsAt &&
    session.updatedAt === session.resolvedAt &&
    session.backgroundedAt === null &&
    session.xpEarned === 0 &&
    session.coinsEarned === 0 &&
    session.rewardClaimedAt === null
  ) {
    return { ok: true, value: { outcome: 'already_cancelled', sessionId: session.id } };
  }
  return failure('SESSION_ALREADY_TERMINAL');
};

export class CancelStandardFocusUseCase {
  constructor(private readonly dependencies: CancelStandardFocusDependencies) {}

  execute(
    sessionId: string,
  ): Promise<ApplicationResult<CancelStandardFocusOutcome, CancelStandardFocusError>> {
    return this.dependencies.coordinator.run(async () => {
      const now = this.dependencies.clock.nowMs();
      if (!Number.isSafeInteger(now) || now < 0) {
        return failure('SESSION_CANCEL_TRANSACTION_FAILED');
      }

      const result = await this.dependencies.transaction.execute<
        CancelStandardFocusOutcome,
        CancelStandardFocusError
      >(async (scope) => {
        const found = await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
        if (!found.ok) return failure('SESSION_CANCEL_READ_FAILED');
        if (found.value === null) return failure('SESSION_NOT_FOUND');
        if (found.value.status !== 'running') return classifyTerminal(found.value);
        const identity = classifyIdentity(found.value);
        if (!identity.ok) return identity;
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
