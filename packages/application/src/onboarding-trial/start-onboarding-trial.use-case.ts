import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { LocalCalendarPort } from '../ports/local-calendar.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { RunningSessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import {
  createOnboardingTrialRecord,
  isRunningOnboardingTrial,
} from './onboarding-trial-record';
import type { SessionCommandCoordinatorPort } from './session-command.coordinator';

export type StartOnboardingTrialOutcome =
  | { readonly outcome: 'started'; readonly session: RunningSessionRecord }
  | { readonly outcome: 'already_running'; readonly session: RunningSessionRecord };

export type StartOnboardingTrialErrorCode =
  | 'SESSION_START_CONFLICT'
  | 'SESSION_TIME_INVALID'
  | 'SESSION_START_READ_FAILED'
  | 'SESSION_START_WRITE_FAILED'
  | 'SESSION_START_TRANSACTION_FAILED';

export interface StartOnboardingTrialError {
  readonly kind: 'start_onboarding_trial_error';
  readonly code: StartOnboardingTrialErrorCode;
}

export interface StartOnboardingTrialDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly sessions: Pick<
    SessionRepository,
    'findActiveInTransaction' | 'insertRunningInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: StartOnboardingTrialErrorCode,
): ApplicationResult<never, StartOnboardingTrialError> => ({
  ok: false,
  error: { kind: 'start_onboarding_trial_error', code },
});

export class StartOnboardingTrialUseCase {
  constructor(private readonly dependencies: StartOnboardingTrialDependencies) {}

  execute(): Promise<ApplicationResult<StartOnboardingTrialOutcome, StartOnboardingTrialError>> {
    return this.dependencies.coordinator.run(async () => {
      const startedAt = this.dependencies.clock.nowMs();
      const id = this.dependencies.id.nextId();
      const endsAt = startedAt + 300_000;
      const calendar = this.dependencies.calendar.snapshot(endsAt);
      if (!calendar.ok) return failure('SESSION_TIME_INVALID');

      const record = createOnboardingTrialRecord({
        id,
        startedAt,
        scheduledEndLocalDate: calendar.value.localDate,
        scheduledEndUtcOffsetMinutes: calendar.value.utcOffsetMinutes,
      });
      if (!record.ok) return failure('SESSION_TIME_INVALID');

      const result = await this.dependencies.transaction.execute<
        StartOnboardingTrialOutcome,
        StartOnboardingTrialError
      >(async (scope) => {
        const active = await this.dependencies.sessions.findActiveInTransaction(scope);
        if (!active.ok) return failure('SESSION_START_READ_FAILED');
        if (active.value !== null) {
          if (isRunningOnboardingTrial(active.value)) {
            return {
              ok: true,
              value: {
                outcome: 'already_running',
                session: active.value,
              },
            };
          }
          return failure('SESSION_START_CONFLICT');
        }

        const inserted = await this.dependencies.sessions.insertRunningInTransaction(
          scope,
          record.value,
        );
        if (!inserted.ok) return failure('SESSION_START_WRITE_FAILED');
        return { ok: true, value: { outcome: 'started', session: record.value } };
      });

      if (!result.ok) {
        return result.error.kind === 'transaction_technical_error'
          ? failure('SESSION_START_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
      }
      return { ok: true, value: result.value };
    });
  }
}
