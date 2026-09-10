import { decideBreakCancellation } from '@pixeldoro/domain';

import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ClockPort } from '../ports/clock.port';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import type { ApplicationResult } from '../result/application-result';
import { isCancelledBreak, isCompletedBreak, isRecoverableRunningBreak,
  isRunningBreak } from './break-session-record';
import { completeBreakInTransaction, type BreakCompletionDependencies } from './complete-break-transaction';

export type CancelBreakOutcome =
  | { readonly outcome: 'cancelled'; readonly sessionId: string; readonly resolvedAt: number;
      readonly freshness: 'fresh_commit' | 'existing_terminal' | 'recovery_commit' }
  | { readonly outcome: 'completed'; readonly sessionId: string; readonly resolvedAt: number;
      readonly freshness: 'fresh_commit' | 'existing_terminal' };

export interface CancelBreakError { readonly kind: 'cancel_break_error'; readonly code:
  | 'BREAK_CANCEL_READ_FAILED' | 'BREAK_CANCEL_WRITE_FAILED'
  | 'BREAK_CANCEL_TRANSACTION_FAILED' | 'BREAK_CANCEL_STATE_INVALID'; }

export interface CancelBreakDependencies extends BreakCompletionDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: Pick<SessionRepository, 'findByIdInTransaction' |
    'transitionFromRunningInTransaction'>;
  readonly transaction: TransactionPort;
}

const failure = (code: CancelBreakError['code']): ApplicationResult<never, CancelBreakError> =>
  ({ ok: false, error: { kind: 'cancel_break_error', code } });

const terminal = (row: SessionRecord): ApplicationResult<CancelBreakOutcome, CancelBreakError> => {
  if (isCompletedBreak(row)) return { ok: true, value: { outcome: 'completed',
    sessionId: row.id, resolvedAt: row.resolvedAt!, freshness: 'existing_terminal' } };
  if (isCancelledBreak(row)) return { ok: true, value: { outcome: 'cancelled',
    sessionId: row.id, resolvedAt: row.resolvedAt!, freshness: 'existing_terminal' } };
  return failure('BREAK_CANCEL_STATE_INVALID');
};

const rereadWinner = async (dependencies: CancelBreakDependencies, scope: TransactionScope,
  sessionId: string): Promise<ApplicationResult<CancelBreakOutcome, CancelBreakError>> => {
  const found = await dependencies.sessions.findByIdInTransaction(scope, sessionId);
  if (!found.ok) return failure('BREAK_CANCEL_READ_FAILED');
  return found.value === null ? failure('BREAK_CANCEL_STATE_INVALID') : terminal(found.value);
};

export class CancelBreakUseCase {
  constructor(private readonly dependencies: CancelBreakDependencies) {}

  execute(sessionId: string): Promise<ApplicationResult<CancelBreakOutcome, CancelBreakError>> {
    const capturedAt = this.dependencies.clock.nowMs();
    if (!sessionId.trim() || !Number.isSafeInteger(capturedAt) || capturedAt < 0) {
      return Promise.resolve(failure('BREAK_CANCEL_STATE_INVALID'));
    }
    return this.dependencies.coordinator.run(async () => {
      try {
        const result = await this.dependencies.transaction.execute<CancelBreakOutcome,
        CancelBreakError>(async (scope) => {
          const found = await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
          if (!found.ok) return failure('BREAK_CANCEL_READ_FAILED');
          if (found.value === null) return failure('BREAK_CANCEL_STATE_INVALID');
          if (found.value.status !== 'running') return terminal(found.value);
          const row = found.value;
          const normal = isRunningBreak(row);
          if (!normal && !isRecoverableRunningBreak(row)) {
            return failure('BREAK_CANCEL_STATE_INVALID');
          }
          const decision = decideBreakCancellation({
            startedAt: row.startedAt, endsAt: row.endsAt, capturedAt,
          });
          if (decision.kind === 'completion_due' && normal) {
            const completed = await completeBreakInTransaction(this.dependencies, scope, row, capturedAt);
            if (!completed.ok) return failure(completed.error.code === 'READ_FAILED'
              ? 'BREAK_CANCEL_READ_FAILED' : completed.error.code === 'WRITE_FAILED'
                ? 'BREAK_CANCEL_WRITE_FAILED' : 'BREAK_CANCEL_STATE_INVALID');
            return completed.value.outcome === 'completed'
              ? { ok: true, value: completed.value }
              : rereadWinner(this.dependencies, scope, sessionId);
          }
          const recovery = !normal || decision.kind === 'invalid';
          const resolvedAt = Math.min(Math.max(capturedAt, row.startedAt), row.endsAt - 1);
          const changed = await this.dependencies.sessions.transitionFromRunningInTransaction(scope, {
            sessionId, status: 'cancelled', resolvedAt, updatedAt: resolvedAt,
            xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
          });
          if (!changed.ok) return failure('BREAK_CANCEL_WRITE_FAILED');
          if (changed.value === 'not_updated') return rereadWinner(this.dependencies, scope, sessionId);
          return { ok: true, value: { outcome: 'cancelled', sessionId, resolvedAt,
            freshness: recovery ? 'recovery_commit' : 'fresh_commit' } };
        });
        if (!result.ok) return result.error.kind === 'transaction_technical_error'
          ? failure('BREAK_CANCEL_TRANSACTION_FAILED') : { ok: false, error: result.error };
        return { ok: true, value: result.value };
      } catch { return failure('BREAK_CANCEL_TRANSACTION_FAILED'); }
    });
  }
}
