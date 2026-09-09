import type { TransactionScope } from '../ports/transaction.port';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isCancelledBreak, isCompletedBreak, isRunningBreak } from './break-session-record';

export interface BreakCompletionDependencies {
  readonly sessions: Pick<SessionRepository,
    'findByIdInTransaction' | 'transitionFromRunningInTransaction'>;
}

export interface BreakCompletionError {
  readonly kind: 'break_completion_error';
  readonly code: 'READ_FAILED' | 'WRITE_FAILED' | 'STATE_INVALID';
}

export type BreakCompletionOutcome =
  | {
      readonly outcome: 'completed';
      readonly sessionId: string;
      readonly resolvedAt: number;
      readonly freshness: 'fresh_commit' | 'existing_terminal';
    }
  | {
      readonly outcome: 'terminal_winner';
      readonly sessionId: string;
    };

const failure = (code: BreakCompletionError['code']):
ApplicationResult<never, BreakCompletionError> => ({
  ok: false,
  error: { kind: 'break_completion_error', code },
});

const readWinner = async (
  dependencies: BreakCompletionDependencies,
  scope: TransactionScope,
  sessionId: string,
): Promise<ApplicationResult<BreakCompletionOutcome, BreakCompletionError>> => {
  const found = await dependencies.sessions.findByIdInTransaction(scope, sessionId);
  if (!found.ok) return failure('READ_FAILED');
  if (found.value !== null && isCompletedBreak(found.value)) return {
    ok: true,
    value: {
      outcome: 'completed',
      sessionId,
      resolvedAt: found.value.resolvedAt!,
      freshness: 'existing_terminal',
    },
  };
  if (found.value !== null && isCancelledBreak(found.value)) return {
    ok: true,
    value: { outcome: 'terminal_winner', sessionId },
  };
  return failure('STATE_INVALID');
};

export const completeBreakInTransaction = async (
  dependencies: BreakCompletionDependencies,
  scope: TransactionScope,
  session: SessionRecord,
  now: number,
): Promise<ApplicationResult<BreakCompletionOutcome, BreakCompletionError>> => {
  if (!isRunningBreak(session) || now < session.endsAt) return failure('STATE_INVALID');
  const transitioned = await dependencies.sessions.transitionFromRunningInTransaction(scope, {
    sessionId: session.id,
    status: 'completed',
    resolvedAt: now,
    updatedAt: now,
    xpEarned: 0,
    coinsEarned: 0,
    rewardClaimedAt: null,
  });
  if (!transitioned.ok) return failure('WRITE_FAILED');
  if (transitioned.value === 'not_updated') {
    return readWinner(dependencies, scope, session.id);
  }
  const committed = await dependencies.sessions.findByIdInTransaction(scope, session.id);
  if (!committed.ok) return failure('READ_FAILED');
  if (committed.value === null || !isCompletedBreak(committed.value) ||
    committed.value.resolvedAt !== now) return failure('STATE_INVALID');
  return {
    ok: true,
    value: {
      outcome: 'completed',
      sessionId: session.id,
      resolvedAt: now,
      freshness: 'fresh_commit',
    },
  };
};
