import type { ClockPort } from '../ports/clock.port';
import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { SessionRepository } from '../persistence/session.repository';
import type { TransactionPort } from '../ports/transaction.port';
import type { ApplicationResult } from '../result/application-result';
import { isRunningStandardFocus } from './standard-focus-record';
import { reconcileStrictStandardFocusInTransaction } from './strict-standard-focus-transaction';
import { completeStandardFocusInTransaction, type StandardCompletionDependencies } from './complete-standard-focus-transaction';
import { readStandardFocusResult } from './load-standard-focus-result.use-case';
import { hasStandardFocusIdentity, isStandardTimestamp, type StandardFocusCompletedResult, type StandardFocusTerminalResult } from './standard-focus-terminal-result';

export type ReconcileStandardFocusOutcome =
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_owned' }
  | { readonly outcome: 'running'; readonly sessionId: string }
  | { readonly outcome: 'safe_episode_cleared'; readonly sessionId: string }
  | {
      readonly outcome: 'completed';
      readonly sessionId: string;
      readonly freshness: 'fresh_commit' | 'existing_terminal';
      readonly resolvedAt: number;
      readonly result: StandardFocusCompletedResult;
    }
  | {
      readonly outcome: 'failed';
      readonly sessionId: string;
      readonly freshness: 'fresh_commit' | 'existing_terminal';
      readonly resolvedAt: number;
    }
  | { readonly outcome: 'terminal_winner'; readonly sessionId: string };

export interface ReconcileStandardFocusError {
  readonly kind: 'reconcile_standard_focus_error';
  readonly code:
    | 'STANDARD_FOCUS_RECONCILE_READ_FAILED'
    | 'STANDARD_FOCUS_RECONCILE_WRITE_FAILED'
    | 'STANDARD_FOCUS_RECONCILE_TRANSACTION_FAILED'
    | 'STANDARD_FOCUS_RECONCILE_STATE_INVALID';
}

export interface ReconcileStandardFocusDependencies extends StandardCompletionDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: StandardCompletionDependencies['sessions'] & Pick<SessionRepository,
    'findActiveInTransaction' | 'clearBackgroundedAtInTransaction'>;
  readonly transaction: TransactionPort;
}

const failure = (code: ReconcileStandardFocusError['code']): ApplicationResult<never, ReconcileStandardFocusError> =>
  ({ ok: false, error: { kind: 'reconcile_standard_focus_error', code } });

const terminalOutcome = (
  result: StandardFocusTerminalResult, freshness: 'fresh_commit' | 'existing_terminal',
): ReconcileStandardFocusOutcome => {
  if (result.status === 'completed') return { outcome: 'completed', sessionId: result.sessionId,
    resolvedAt: result.resolvedAt, freshness, result };
  if (result.status === 'failed') return { outcome: 'failed', sessionId: result.sessionId,
    resolvedAt: result.resolvedAt, freshness };
  return { outcome: 'terminal_winner', sessionId: result.sessionId };
};

export class ReconcileStandardFocusUseCase {
  constructor(private readonly dependencies: ReconcileStandardFocusDependencies) {}

  execute(sessionId?: string): Promise<ApplicationResult<ReconcileStandardFocusOutcome, ReconcileStandardFocusError>> {
    return this.dependencies.coordinator.run(async () => {
      try {
        const now = this.dependencies.clock.nowMs();
        if (!isStandardTimestamp(now)) return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
        const result = await this.dependencies.transaction.execute<ReconcileStandardFocusOutcome, ReconcileStandardFocusError>(async (scope) => {
          const found = sessionId === undefined
            ? await this.dependencies.sessions.findActiveInTransaction(scope)
            : await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
          if (!found.ok) return failure('STANDARD_FOCUS_RECONCILE_READ_FAILED');
          if (found.value === null) return { ok: true, value: { outcome: 'no_active_session' } };
          const session = found.value;
          if (sessionId !== undefined && session.id !== sessionId) return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
          if (session.sessionType !== 'focus' || session.focusVariant !== 'standard') {
            return { ok: true, value: { outcome: 'not_owned' } };
          }
          if (session.status !== 'running') {
            const terminal = await readStandardFocusResult(this.dependencies, scope, session.id);
            if (!terminal.ok) return failure(terminal.error.code.includes('READ')
              ? 'STANDARD_FOCUS_RECONCILE_READ_FAILED' : 'STANDARD_FOCUS_RECONCILE_STATE_INVALID');
            if (terminal.value.outcome !== 'ready') return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
            return { ok: true, value: terminalOutcome(terminal.value.result, 'existing_terminal') };
          }
          if (!isRunningStandardFocus(session) || !hasStandardFocusIdentity(session) || now < session.updatedAt) {
            return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
          }
          if (session.mode === 'strict') {
            const strict = await reconcileStrictStandardFocusInTransaction(this.dependencies, scope, session, now);
            if (!strict.ok) return failure(strict.error.code === 'READ_FAILED' ? 'STANDARD_FOCUS_RECONCILE_READ_FAILED'
              : strict.error.code === 'WRITE_FAILED' ? 'STANDARD_FOCUS_RECONCILE_WRITE_FAILED' : 'STANDARD_FOCUS_RECONCILE_STATE_INVALID');
            if (strict.value.outcome !== 'completion_due') {
              if (strict.value.outcome === 'terminal_winner') {
                const winner = await readStandardFocusResult(this.dependencies, scope, session.id);
                if (!winner.ok || winner.value.outcome !== 'ready') return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
                return { ok: true, value: terminalOutcome(winner.value.result, 'existing_terminal') };
              }
              return { ok: true, value: { ...strict.value, sessionId: session.id } };
            }
          } else if (now < session.endsAt) {
            return { ok: true, value: { outcome: 'running', sessionId: session.id } };
          }
          const completed = await completeStandardFocusInTransaction(this.dependencies, scope, session, now);
          if (!completed.ok) return failure(completed.error.code === 'READ_FAILED' ? 'STANDARD_FOCUS_RECONCILE_READ_FAILED'
            : completed.error.code === 'WRITE_FAILED' ? 'STANDARD_FOCUS_RECONCILE_WRITE_FAILED' : 'STANDARD_FOCUS_RECONCILE_STATE_INVALID');
          return { ok: true, value: terminalOutcome(completed.value.result, completed.value.freshness) };
        });
        if (!result.ok) return result.error.kind === 'transaction_technical_error'
          ? failure('STANDARD_FOCUS_RECONCILE_TRANSACTION_FAILED') : { ok: false, error: result.error };
        return { ok: true, value: result.value };
      } catch { return failure('STANDARD_FOCUS_RECONCILE_TRANSACTION_FAILED'); }
    });
  }
}
