import { decideBreakReconciliation } from '@pixeldoro/domain';

import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { ClockPort } from '../ports/clock.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isCancelledBreak, isCompletedBreak, isRunningBreak } from './break-session-record';
import {
  completeBreakInTransaction,
  type BreakCompletionDependencies,
  type BreakCompletionOutcome,
} from './complete-break-transaction';

export type ReconcileBreakOutcome =
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_owned' }
  | { readonly outcome: 'running'; readonly sessionId: string }
  | Extract<BreakCompletionOutcome, { readonly outcome: 'completed' }>
  | { readonly outcome: 'terminal_winner'; readonly sessionId: string };

export interface ReconcileBreakError {
  readonly kind: 'reconcile_break_error';
  readonly code:
    | 'BREAK_RECONCILE_READ_FAILED'
    | 'BREAK_RECONCILE_WRITE_FAILED'
    | 'BREAK_RECONCILE_TRANSACTION_FAILED'
    | 'BREAK_RECONCILE_STATE_INVALID';
}

export interface ReconcileBreakDependencies extends BreakCompletionDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: BreakCompletionDependencies['sessions'] & Pick<SessionRepository,
    'findActiveInTransaction'>;
  readonly transaction: TransactionPort;
}

const failure = (code: ReconcileBreakError['code']):
ApplicationResult<never, ReconcileBreakError> => ({
  ok: false,
  error: { kind: 'reconcile_break_error', code },
});

export class ReconcileBreakUseCase {
  constructor(private readonly dependencies: ReconcileBreakDependencies) {}

  execute(sessionId?: string): Promise<
  ApplicationResult<ReconcileBreakOutcome, ReconcileBreakError>> {
    if (sessionId !== undefined && !sessionId.trim()) {
      return Promise.resolve(failure('BREAK_RECONCILE_STATE_INVALID'));
    }
    return this.dependencies.coordinator.run(async () => {
      try {
        const now = this.dependencies.clock.nowMs();
        const result = await this.dependencies.transaction.execute<
        ReconcileBreakOutcome, ReconcileBreakError>(async (scope) => {
          const found = sessionId === undefined
            ? await this.dependencies.sessions.findActiveInTransaction(scope)
            : await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
          if (!found.ok) return failure('BREAK_RECONCILE_READ_FAILED');
          if (found.value === null) return sessionId === undefined
            ? { ok: true, value: { outcome: 'no_active_session' } }
            : failure('BREAK_RECONCILE_STATE_INVALID');
          const session = found.value;
          const isBreak = session.sessionType === 'short_break' ||
            session.sessionType === 'long_break';
          if (!isBreak) return sessionId === undefined
            ? { ok: true, value: { outcome: 'not_owned' } }
            : failure('BREAK_RECONCILE_STATE_INVALID');
          if (isCompletedBreak(session)) return { ok: true, value: {
            outcome: 'completed', sessionId: session.id, resolvedAt: session.resolvedAt!,
            freshness: 'existing_terminal',
          } };
          if (isCancelledBreak(session)) return { ok: true, value: {
            outcome: 'terminal_winner', sessionId: session.id,
          } };
          if (!isRunningBreak(session)) return failure('BREAK_RECONCILE_STATE_INVALID');
          const decision = decideBreakReconciliation({
            startedAt: session.startedAt,
            endsAt: session.endsAt,
            updatedAt: session.updatedAt,
            nowMs: now,
          });
          if (decision.kind === 'invalid') return failure('BREAK_RECONCILE_STATE_INVALID');
          if (decision.kind === 'running') return { ok: true, value: {
            outcome: 'running', sessionId: session.id,
          } };
          const completed = await completeBreakInTransaction(
            this.dependencies, scope, session, now,
          );
          if (!completed.ok) return failure(completed.error.code === 'READ_FAILED'
            ? 'BREAK_RECONCILE_READ_FAILED'
            : completed.error.code === 'WRITE_FAILED'
              ? 'BREAK_RECONCILE_WRITE_FAILED'
              : 'BREAK_RECONCILE_STATE_INVALID');
          return { ok: true, value: completed.value };
        });
        if (!result.ok) return result.error.kind === 'transaction_technical_error'
          ? failure('BREAK_RECONCILE_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
        return { ok: true, value: result.value };
      } catch {
        return failure('BREAK_RECONCILE_TRANSACTION_FAILED');
      }
    });
  }
}
