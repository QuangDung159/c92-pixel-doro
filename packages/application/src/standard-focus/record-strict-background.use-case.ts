import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { SessionRepository } from '../persistence/session.repository';
import type { TransactionPort } from '../ports/transaction.port';
import type { ApplicationResult } from '../result/application-result';
import { isRunningStandardFocus } from './standard-focus-record';

export type RecordStrictBackgroundOutcome =
  | { readonly outcome: 'recorded'; readonly sessionId: string }
  | { readonly outcome: 'already_recorded'; readonly sessionId: string }
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_strict_standard' }
  | { readonly outcome: 'deadline_pending'; readonly sessionId: string }
  | { readonly outcome: 'stale_event'; readonly sessionId: string };

export interface RecordStrictBackgroundError {
  readonly kind: 'record_strict_background_error';
  readonly code:
    | 'STRICT_BACKGROUND_READ_FAILED'
    | 'STRICT_BACKGROUND_WRITE_FAILED'
    | 'STRICT_BACKGROUND_TRANSACTION_FAILED'
    | 'STRICT_BACKGROUND_TIMESTAMP_INVALID';
}

export interface RecordStrictBackgroundDependencies {
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly sessions: Pick<
    SessionRepository,
    'findActiveInTransaction' | 'findByIdInTransaction' | 'recordBackgroundedAtInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: RecordStrictBackgroundError['code'],
): ApplicationResult<never, RecordStrictBackgroundError> => ({
  ok: false,
  error: { kind: 'record_strict_background_error', code },
});

export class RecordStrictBackgroundUseCase {
  constructor(private readonly dependencies: RecordStrictBackgroundDependencies) {}

  execute(
    capturedAt: number,
  ): Promise<ApplicationResult<RecordStrictBackgroundOutcome, RecordStrictBackgroundError>> {
    return this.dependencies.coordinator.run(async () => {
      if (!Number.isSafeInteger(capturedAt) || capturedAt < 0) {
        return failure('STRICT_BACKGROUND_TIMESTAMP_INVALID');
      }
      const result = await this.dependencies.transaction.execute<
        RecordStrictBackgroundOutcome,
        RecordStrictBackgroundError
      >(async (scope) => {
        const found = await this.dependencies.sessions.findActiveInTransaction(scope);
        if (!found.ok) return failure('STRICT_BACKGROUND_READ_FAILED');
        if (found.value === null) return { ok: true, value: { outcome: 'no_active_session' } };
        const active = found.value;
        if (!isRunningStandardFocus(active) || active.mode !== 'strict') {
          return { ok: true, value: { outcome: 'not_strict_standard' } };
        }
        if (capturedAt >= active.endsAt) {
          return { ok: true, value: { outcome: 'deadline_pending', sessionId: active.id } };
        }
        if (active.backgroundedAt !== null) {
          return { ok: true, value: { outcome: 'already_recorded', sessionId: active.id } };
        }
        if (capturedAt < active.startedAt || capturedAt < active.updatedAt) {
          return { ok: true, value: { outcome: 'stale_event', sessionId: active.id } };
        }
        const recorded = await this.dependencies.sessions.recordBackgroundedAtInTransaction(scope, {
          sessionId: active.id,
          backgroundedAt: capturedAt,
          updatedAt: capturedAt,
        });
        if (!recorded.ok) return failure('STRICT_BACKGROUND_WRITE_FAILED');
        if (recorded.value === 'updated') {
          return { ok: true, value: { outcome: 'recorded', sessionId: active.id } };
        }
        const winner = await this.dependencies.sessions.findByIdInTransaction(scope, active.id);
        if (!winner.ok) return failure('STRICT_BACKGROUND_READ_FAILED');
        if (winner.value === null || winner.value.status !== 'running') {
          return { ok: true, value: { outcome: 'no_active_session' } };
        }
        if (winner.value.backgroundedAt !== null) {
          return { ok: true, value: { outcome: 'already_recorded', sessionId: active.id } };
        }
        return { ok: true, value: { outcome: 'stale_event', sessionId: active.id } };
      });
      if (!result.ok) {
        return result.error.kind === 'transaction_technical_error'
          ? failure('STRICT_BACKGROUND_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
      }
      return { ok: true, value: result.value };
    });
  }
}
