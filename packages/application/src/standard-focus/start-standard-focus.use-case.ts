import {
  validateStandardFocusConfiguration,
  type FocusMode,
  type WorkTag,
} from '@pixeldoro/domain';

import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { LocalCalendarPort } from '../ports/local-calendar.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { RunningSessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import { createStandardFocusRecord } from './standard-focus-record';

export interface StartStandardFocusInput {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

export interface StartStandardFocusOutcome {
  readonly outcome: 'started';
  readonly session: RunningSessionRecord;
}

export type StartStandardFocusErrorCode =
  | 'STANDARD_FOCUS_CONFIG_INVALID'
  | 'SESSION_TIME_INVALID'
  | 'SESSION_START_CONFLICT'
  | 'SESSION_START_READ_FAILED'
  | 'SESSION_START_WRITE_FAILED'
  | 'SESSION_START_TRANSACTION_FAILED';

export interface StartStandardFocusError {
  readonly kind: 'start_standard_focus_error';
  readonly code: StartStandardFocusErrorCode;
}

export interface StartStandardFocusDependencies {
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
  code: StartStandardFocusErrorCode,
): ApplicationResult<never, StartStandardFocusError> => ({
  ok: false,
  error: { kind: 'start_standard_focus_error', code },
});

export class StartStandardFocusUseCase {
  constructor(private readonly dependencies: StartStandardFocusDependencies) {}

  execute(
    input: StartStandardFocusInput,
  ): Promise<ApplicationResult<StartStandardFocusOutcome, StartStandardFocusError>> {
    const configuration = validateStandardFocusConfiguration(input);
    if (!configuration.ok) {
      return Promise.resolve(failure('STANDARD_FOCUS_CONFIG_INVALID'));
    }

    return this.dependencies.coordinator.run(async () => {
      const startedAt = this.dependencies.clock.nowMs();
      const endsAt = startedAt + configuration.value.durationMinutes * 60_000;
      if (!Number.isSafeInteger(endsAt)) return failure('SESSION_TIME_INVALID');
      const calendar = this.dependencies.calendar.snapshot(endsAt);
      if (!calendar.ok) return failure('SESSION_TIME_INVALID');
      const record = createStandardFocusRecord({
        id: this.dependencies.id.nextId(),
        configuration: configuration.value,
        startedAt,
        scheduledEndLocalDate: calendar.value.localDate,
        scheduledEndUtcOffsetMinutes: calendar.value.utcOffsetMinutes,
      });
      if (!record.ok) return failure('SESSION_TIME_INVALID');

      const result = await this.dependencies.transaction.execute<
        StartStandardFocusOutcome,
        StartStandardFocusError
      >(async (scope) => {
        const active = await this.dependencies.sessions.findActiveInTransaction(scope);
        if (!active.ok) return failure('SESSION_START_READ_FAILED');
        if (active.value !== null) return failure('SESSION_START_CONFLICT');

        const inserted = await this.dependencies.sessions.insertRunningInTransaction(
          scope,
          record.value,
        );
        if (!inserted.ok) {
          return failure(
            inserted.error.code === 'PERSISTENCE_CONFLICT'
              ? 'SESSION_START_CONFLICT'
              : 'SESSION_START_WRITE_FAILED',
          );
        }
        return {
          ok: true,
          value: { outcome: 'started', session: record.value },
        };
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
