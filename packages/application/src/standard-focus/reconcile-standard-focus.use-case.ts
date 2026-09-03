import type { ClockPort } from '../ports/clock.port';
import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { SessionRepository } from '../persistence/session.repository';
import type { TransactionPort } from '../ports/transaction.port';
import type { ApplicationResult } from '../result/application-result';
import { isRunningStandardFocus } from './standard-focus-record';
import { reconcileStrictStandardFocusInTransaction } from './strict-standard-focus-transaction';

export type ReconcileStandardFocusOutcome =
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_owned' }
  | { readonly outcome: 'running'; readonly sessionId: string }
  | { readonly outcome: 'safe_episode_cleared'; readonly sessionId: string }
  | { readonly outcome: 'completion_due'; readonly sessionId: string }
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

export interface ReconcileStandardFocusDependencies {
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: Pick<
    SessionRepository,
    | 'findActiveInTransaction'
    | 'findByIdInTransaction'
    | 'clearBackgroundedAtInTransaction'
    | 'transitionFromRunningInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: ReconcileStandardFocusError['code'],
): ApplicationResult<never, ReconcileStandardFocusError> => ({
  ok: false,
  error: { kind: 'reconcile_standard_focus_error', code },
});

export class ReconcileStandardFocusUseCase {
  constructor(private readonly dependencies: ReconcileStandardFocusDependencies) {}

  execute(
    sessionId?: string,
  ): Promise<ApplicationResult<ReconcileStandardFocusOutcome, ReconcileStandardFocusError>> {
    return this.dependencies.coordinator.run(async () => {
      const now = this.dependencies.clock.nowMs();
      if (!Number.isSafeInteger(now) || now < 0) {
        return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
      }
      const result = await this.dependencies.transaction.execute<
        ReconcileStandardFocusOutcome,
        ReconcileStandardFocusError
      >(async (scope) => {
        const found = sessionId === undefined
          ? await this.dependencies.sessions.findActiveInTransaction(scope)
          : await this.dependencies.sessions.findByIdInTransaction(scope, sessionId);
        if (!found.ok) return failure('STANDARD_FOCUS_RECONCILE_READ_FAILED');
        if (found.value === null) return { ok: true, value: { outcome: 'no_active_session' } };
        const session = found.value;
        if (session.status !== 'running') {
          if (
            session.sessionType === 'focus' &&
            session.focusVariant === 'standard' &&
            session.mode === 'strict' &&
            session.status === 'failed' &&
            session.resolvedAt !== null
          ) {
            return {
              ok: true,
              value: {
                outcome: 'failed',
                sessionId: session.id,
                freshness: 'existing_terminal',
                resolvedAt: session.resolvedAt,
              },
            };
          }
          return { ok: true, value: { outcome: 'terminal_winner', sessionId: session.id } };
        }
        if (!isRunningStandardFocus(session) || session.mode !== 'strict') {
          return { ok: true, value: { outcome: 'not_owned' } };
        }
        const reconciled = await reconcileStrictStandardFocusInTransaction(
          { sessions: this.dependencies.sessions },
          scope,
          session,
          now,
        );
        if (!reconciled.ok) {
          if (reconciled.error.code === 'READ_FAILED') {
            return failure('STANDARD_FOCUS_RECONCILE_READ_FAILED');
          }
          if (reconciled.error.code === 'WRITE_FAILED') {
            return failure('STANDARD_FOCUS_RECONCILE_WRITE_FAILED');
          }
          return failure('STANDARD_FOCUS_RECONCILE_STATE_INVALID');
        }
        const value = reconciled.value;
        if (value.outcome === 'failed') {
          return { ok: true, value: { ...value, sessionId: session.id } };
        }
        if (value.outcome === 'terminal_winner') {
          return { ok: true, value: { outcome: 'terminal_winner', sessionId: session.id } };
        }
        return { ok: true, value: { outcome: value.outcome, sessionId: session.id } };
      });
      if (!result.ok) {
        return result.error.kind === 'transaction_technical_error'
          ? failure('STANDARD_FOCUS_RECONCILE_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
      }
      return { ok: true, value: result.value };
    });
  }
}
