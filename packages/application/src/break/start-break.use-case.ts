import { decideNextBreakRecommendation } from '@pixeldoro/domain';

import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { LocalCalendarPort } from '../ports/local-calendar.port';
import type { TransactionPort } from '../ports/transaction.port';
import type {
  LongBreakCadenceFacts,
  TransactionalLongBreakCadenceQuery,
} from '../persistence/derived-query';
import type { RunningSessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { createBreakSessionRecord } from './break-session-record';
import {
  isEligibleCompletedStandardFocusSource,
  isSafeSessionTimestamp,
} from './break-source';

export interface StartBreakInput {
  readonly sourceFocusSessionId: string;
}

export interface StartBreakOutcome {
  readonly outcome: 'started';
  readonly sourceFocusSessionId: string;
  readonly session: RunningSessionRecord;
}

export type StartBreakErrorCode =
  | 'BREAK_SOURCE_INELIGIBLE'
  | 'BREAK_CADENCE_READ_FAILED'
  | 'BREAK_CADENCE_FACTS_INVALID'
  | 'SESSION_START_CONFLICT'
  | 'SESSION_START_READ_FAILED'
  | 'SESSION_TIME_INVALID'
  | 'SESSION_START_WRITE_FAILED'
  | 'SESSION_START_TRANSACTION_FAILED';

export interface StartBreakError {
  readonly kind: 'start_break_error';
  readonly code: StartBreakErrorCode;
}

export interface StartBreakDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly longBreakCadence: TransactionalLongBreakCadenceQuery;
  readonly sessions: Pick<SessionRepository,
    'findByIdInTransaction' | 'findActiveInTransaction' | 'insertRunningInTransaction'>;
  readonly transaction: TransactionPort;
}

const failure = (code: StartBreakErrorCode): ApplicationResult<never, StartBreakError> => ({
  ok: false,
  error: { kind: 'start_break_error', code },
});

const validFacts = (facts: LongBreakCadenceFacts, profileId: number): boolean =>
  facts.profileId === profileId &&
  Number.isSafeInteger(facts.completedStandardFocusCountSinceLastCompletedLongBreak) &&
  facts.completedStandardFocusCountSinceLastCompletedLongBreak >= 0 &&
  (facts.latestCompletedLongBreak === null ||
    (facts.latestCompletedLongBreak.sessionId.trim().length > 0 &&
      isSafeSessionTimestamp(facts.latestCompletedLongBreak.resolvedAt)));

export class StartBreakUseCase {
  constructor(private readonly dependencies: StartBreakDependencies) {}

  execute(input: StartBreakInput): Promise<ApplicationResult<StartBreakOutcome, StartBreakError>> {
    if (!input.sourceFocusSessionId.trim()) {
      return Promise.resolve(failure('BREAK_SOURCE_INELIGIBLE'));
    }
    return this.dependencies.coordinator.run(async () => {
      const startedAt = this.dependencies.clock.nowMs();
      const result = await this.dependencies.transaction.execute<StartBreakOutcome, StartBreakError>(
        async (scope) => {
          const source = await this.dependencies.sessions.findByIdInTransaction(
            scope,
            input.sourceFocusSessionId,
          );
          if (!source.ok) return failure('SESSION_START_READ_FAILED');
          if (source.value === null ||
            !isEligibleCompletedStandardFocusSource(source.value, input.sourceFocusSessionId)) {
            return failure('BREAK_SOURCE_INELIGIBLE');
          }

          const facts = await this.dependencies.longBreakCadence.getFactsInTransaction(
            scope,
            source.value.profileId,
          );
          if (!facts.ok) return failure('BREAK_CADENCE_READ_FAILED');
          if (!validFacts(facts.value, source.value.profileId)) {
            return failure('BREAK_CADENCE_FACTS_INVALID');
          }
          const recommendation = decideNextBreakRecommendation(
            facts.value.completedStandardFocusCountSinceLastCompletedLongBreak,
          );
          if (!recommendation.ok) return failure('BREAK_CADENCE_FACTS_INVALID');

          const active = await this.dependencies.sessions.findActiveInTransaction(scope);
          if (!active.ok) return failure('SESSION_START_READ_FAILED');
          if (active.value !== null) return failure('SESSION_START_CONFLICT');

          const endsAt = startedAt + recommendation.value.durationMinutes * 60_000;
          if (!isSafeSessionTimestamp(startedAt) || !isSafeSessionTimestamp(endsAt)) {
            return failure('SESSION_TIME_INVALID');
          }
          const calendar = this.dependencies.calendar.snapshot(endsAt);
          if (!calendar.ok) return failure('SESSION_TIME_INVALID');
          const record = createBreakSessionRecord({
            id: this.dependencies.id.nextId(),
            recommendation: recommendation.value,
            startedAt,
            scheduledEndLocalDate: calendar.value.localDate,
            scheduledEndUtcOffsetMinutes: calendar.value.utcOffsetMinutes,
          });
          if (!record.ok) return failure('SESSION_TIME_INVALID');

          const inserted = await this.dependencies.sessions.insertRunningInTransaction(
            scope,
            record.value,
          );
          if (!inserted.ok) {
            return failure(inserted.error.code === 'PERSISTENCE_CONFLICT'
              ? 'SESSION_START_CONFLICT'
              : 'SESSION_START_WRITE_FAILED');
          }
          return {
            ok: true,
            value: {
              outcome: 'started',
              sourceFocusSessionId: input.sourceFocusSessionId,
              session: record.value,
            },
          };
        },
      );
      if (!result.ok) {
        return result.error.kind === 'transaction_technical_error'
          ? failure('SESSION_START_TRANSACTION_FAILED')
          : { ok: false, error: result.error };
      }
      return { ok: true, value: result.value };
    });
  }
}
