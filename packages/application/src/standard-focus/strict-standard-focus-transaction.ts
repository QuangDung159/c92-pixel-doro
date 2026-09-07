import { decideStrictReconciliation } from '@pixeldoro/domain';

import type { TransactionScope } from '../ports/transaction.port';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isRunningStandardFocus } from './standard-focus-record';

export type StrictTransactionOutcome =
  | { readonly outcome: 'running' }
  | { readonly outcome: 'safe_episode_cleared' }
  | { readonly outcome: 'completion_due' }
  | {
      readonly outcome: 'failed';
      readonly freshness: 'fresh_commit' | 'existing_terminal';
      readonly resolvedAt: number;
    }
  | { readonly outcome: 'terminal_winner'; readonly status: SessionRecord['status'] };

export interface StrictTransactionError {
  readonly kind: 'strict_transaction_error';
  readonly code: 'READ_FAILED' | 'WRITE_FAILED' | 'STATE_INVALID';
}

export interface StrictTransactionDependencies {
  readonly sessions: Pick<
    SessionRepository,
    | 'findByIdInTransaction'
    | 'clearBackgroundedAtInTransaction'
    | 'transitionFromRunningInTransaction'
  >;
}

const failure = (
  code: StrictTransactionError['code'],
): ApplicationResult<never, StrictTransactionError> => ({
  ok: false,
  error: { kind: 'strict_transaction_error', code },
});

const classifyWinner = (
  session: SessionRecord,
): ApplicationResult<StrictTransactionOutcome, StrictTransactionError> => {
  if (
    session.sessionType !== 'focus' ||
    session.focusVariant !== 'standard' ||
    session.mode !== 'strict'
  ) return failure('STATE_INVALID');
  if (
    session.status === 'failed' &&
    session.resolvedAt !== null &&
    Number.isSafeInteger(session.resolvedAt) &&
    session.resolvedAt >= session.startedAt &&
    session.xpEarned === 0 &&
    session.coinsEarned === 0 &&
    session.rewardClaimedAt === null &&
    session.backgroundedAt !== null
  ) {
    return {
      ok: true,
      value: {
        outcome: 'failed',
        freshness: 'existing_terminal',
        resolvedAt: session.resolvedAt,
      },
    };
  }
  if (session.status !== 'running') {
    return { ok: true, value: { outcome: 'terminal_winner', status: session.status } };
  }
  return failure('STATE_INVALID');
};

const rereadWinner = async (
  dependencies: StrictTransactionDependencies,
  scope: TransactionScope,
  sessionId: string,
): Promise<ApplicationResult<StrictTransactionOutcome, StrictTransactionError>> => {
  const winner = await dependencies.sessions.findByIdInTransaction(scope, sessionId);
  if (!winner.ok) return failure('READ_FAILED');
  if (winner.value === null) return failure('STATE_INVALID');
  if (isRunningStandardFocus(winner.value) && winner.value.mode === 'strict') {
    return { ok: true, value: { outcome: 'running' } };
  }
  return classifyWinner(winner.value);
};

export const reconcileStrictStandardFocusInTransaction = async (
  dependencies: StrictTransactionDependencies,
  scope: TransactionScope,
  session: SessionRecord,
  now: number,
): Promise<ApplicationResult<StrictTransactionOutcome, StrictTransactionError>> => {
  if (!isRunningStandardFocus(session) || session.mode !== 'strict') {
    return session.status === 'running'
      ? failure('STATE_INVALID')
      : classifyWinner(session);
  }
  const decision = decideStrictReconciliation({
    startedAt: session.startedAt,
    endsAt: session.endsAt,
    backgroundedAt: session.backgroundedAt,
    now,
  });
  if (decision.outcome === 'invalid') return failure('STATE_INVALID');
  if (decision.outcome === 'running_no_evidence') {
    return { ok: true, value: { outcome: 'running' } };
  }
  if (decision.outcome === 'completion_due') {
    return { ok: true, value: { outcome: 'completion_due' } };
  }
  if (decision.outcome === 'running_safe_clear') {
    const cleared = await dependencies.sessions.clearBackgroundedAtInTransaction(scope, {
      sessionId: session.id,
      expectedBackgroundedAt: decision.expectedBackgroundedAt,
      updatedAt: now,
    });
    if (!cleared.ok) return failure('WRITE_FAILED');
    if (cleared.value === 'updated') {
      return { ok: true, value: { outcome: 'safe_episode_cleared' } };
    }
    return rereadWinner(dependencies, scope, session.id);
  }

  const transitioned = await dependencies.sessions.transitionFromRunningInTransaction(scope, {
    sessionId: session.id,
    status: 'failed',
    resolvedAt: now,
    xpEarned: 0,
    coinsEarned: 0,
    rewardClaimedAt: null,
    updatedAt: now,
  });
  if (!transitioned.ok) return failure('WRITE_FAILED');
  if (transitioned.value === 'updated') {
    return {
      ok: true,
      value: { outcome: 'failed', freshness: 'fresh_commit', resolvedAt: now },
    };
  }
  return rereadWinner(dependencies, scope, session.id);
};
