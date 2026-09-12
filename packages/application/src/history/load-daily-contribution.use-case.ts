import { MVP_PROFILE_ID } from '../onboarding-trial/onboarding-trial-record';
import type { ClockPort } from '../ports/clock.port';
import type { LocalCalendarPort } from '../ports/local-calendar.port';
import type { ContributionQuery } from '../persistence/derived-query';
import type { PersistenceError } from '../persistence/persistence.error';
import type { ApplicationResult } from '../result/application-result';
import {
  buildContributionRangeProjection,
  type ContributionRangeProjection,
} from './build-contribution-range-projection';

export type LoadDailyContributionErrorCode =
  | 'CONTRIBUTION_DATE_UNAVAILABLE'
  | 'CONTRIBUTION_READ_FAILED'
  | 'CONTRIBUTION_DATA_INVALID';

export interface LoadDailyContributionError {
  readonly kind: 'load_daily_contribution_error';
  readonly code: LoadDailyContributionErrorCode;
}

export interface LoadDailyContributionDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly contribution: ContributionQuery;
}

const failure = (
  code: LoadDailyContributionErrorCode,
): ApplicationResult<never, LoadDailyContributionError> => ({
  ok: false,
  error: { kind: 'load_daily_contribution_error', code },
});

const codeForPersistenceError = (
  error: PersistenceError,
): LoadDailyContributionErrorCode =>
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
    ? 'CONTRIBUTION_DATA_INVALID'
    : 'CONTRIBUTION_READ_FAILED';

export class LoadDailyContributionUseCase {
  constructor(private readonly dependencies: LoadDailyContributionDependencies) {}

  async execute(): Promise<
    ApplicationResult<ContributionRangeProjection, LoadDailyContributionError>
  > {
    let nowMs: number;
    try {
      nowMs = this.dependencies.clock.nowMs();
    } catch {
      return failure('CONTRIBUTION_DATE_UNAVAILABLE');
    }
    if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
      return failure('CONTRIBUTION_DATE_UNAVAILABLE');
    }
    const snapshot = this.dependencies.calendar.snapshot(nowMs);
    if (!snapshot.ok) return failure('CONTRIBUTION_DATE_UNAVAILABLE');

    const emptyRange = buildContributionRangeProjection({
      endLocalDate: snapshot.value.localDate,
      facts: [],
    });
    if (!emptyRange.ok) return failure('CONTRIBUTION_DATE_UNAVAILABLE');

    try {
      const result = await this.dependencies.contribution.listRange({
        profileId: MVP_PROFILE_ID,
        startLocalDate: emptyRange.value.startLocalDate,
        endLocalDate: emptyRange.value.endLocalDate,
      });
      if (!result.ok) return failure(codeForPersistenceError(result.error));
      const projection = buildContributionRangeProjection({
        endLocalDate: snapshot.value.localDate,
        facts: result.value,
      });
      return projection.ok
        ? projection
        : failure('CONTRIBUTION_DATA_INVALID');
    } catch {
      return failure('CONTRIBUTION_READ_FAILED');
    }
  }
}
