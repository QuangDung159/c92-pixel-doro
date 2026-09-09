import {
  decideNextBreakRecommendation,
  validateStandardFocusConfiguration,
  type BreakRecommendation,
} from '@pixeldoro/domain';

import type {
  LongBreakCadenceFacts,
  LongBreakCadenceQuery,
} from '../persistence/derived-query';
import type {
  SessionRecord,
  SessionRepository,
} from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';

export interface LoadNextBreakRecommendationOutcome {
  readonly outcome: 'ready';
  readonly sourceSessionId: string;
  readonly recommendation: BreakRecommendation;
  readonly completedStandardFocusCountSinceLastCompletedLongBreak: number;
  readonly latestCompletedLongBreakSessionId: string | null;
}

export type LoadNextBreakRecommendationErrorCode =
  | 'BREAK_RECOMMENDATION_SOURCE_INELIGIBLE'
  | 'BREAK_RECOMMENDATION_READ_FAILED'
  | 'BREAK_RECOMMENDATION_FACTS_INVALID';

export interface LoadNextBreakRecommendationError {
  readonly kind: 'load_next_break_recommendation_error';
  readonly code: LoadNextBreakRecommendationErrorCode;
}

export interface LoadNextBreakRecommendationDependencies {
  readonly sessions: Pick<SessionRepository, 'findById'>;
  readonly longBreakCadence: LongBreakCadenceQuery;
}

const MAX_TIMESTAMP = 8_640_000_000_000_000;

const failure = (
  code: LoadNextBreakRecommendationErrorCode,
): ApplicationResult<never, LoadNextBreakRecommendationError> => ({
  ok: false,
  error: { kind: 'load_next_break_recommendation_error', code },
});

const isTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

const isEligibleSource = (row: SessionRecord, sessionId: string): boolean => {
  const configuration = validateStandardFocusConfiguration({
    durationMinutes: row.configuredDurationMinutes,
    mode: row.mode,
    workTag: row.workTag,
  });
  return (
    row.id === sessionId &&
    row.profileId === 1 &&
    row.sessionType === 'focus' &&
    row.focusVariant === 'standard' &&
    row.status === 'completed' &&
    configuration.ok &&
    isTimestamp(row.startedAt) &&
    isTimestamp(row.endsAt) &&
    row.endsAt === row.startedAt + row.configuredDurationMinutes * 60_000 &&
    row.resolvedAt !== null &&
    isTimestamp(row.resolvedAt) &&
    row.resolvedAt >= row.endsAt &&
    row.updatedAt === row.resolvedAt &&
    row.rewardClaimedAt === row.resolvedAt
  );
};

const validFacts = (
  facts: LongBreakCadenceFacts,
  profileId: number,
): boolean =>
  facts.profileId === profileId &&
  Number.isSafeInteger(
    facts.completedStandardFocusCountSinceLastCompletedLongBreak,
  ) &&
  facts.completedStandardFocusCountSinceLastCompletedLongBreak >= 0 &&
  (facts.latestCompletedLongBreak === null ||
    (facts.latestCompletedLongBreak.sessionId.trim().length > 0 &&
      isTimestamp(facts.latestCompletedLongBreak.resolvedAt)));

export class LoadNextBreakRecommendationUseCase {
  constructor(
    private readonly dependencies: LoadNextBreakRecommendationDependencies,
  ) {}

  async execute(
    sourceSessionId: string,
  ): Promise<
    ApplicationResult<
      LoadNextBreakRecommendationOutcome,
      LoadNextBreakRecommendationError
    >
  > {
    if (!sourceSessionId.trim()) {
      return failure('BREAK_RECOMMENDATION_SOURCE_INELIGIBLE');
    }

    try {
      const source = await this.dependencies.sessions.findById(sourceSessionId);
      if (!source.ok) return failure('BREAK_RECOMMENDATION_READ_FAILED');
      if (
        source.value === null ||
        !isEligibleSource(source.value, sourceSessionId)
      ) {
        return failure('BREAK_RECOMMENDATION_SOURCE_INELIGIBLE');
      }

      const facts = await this.dependencies.longBreakCadence.getFacts(
        source.value.profileId,
      );
      if (!facts.ok) return failure('BREAK_RECOMMENDATION_READ_FAILED');
      if (!validFacts(facts.value, source.value.profileId)) {
        return failure('BREAK_RECOMMENDATION_FACTS_INVALID');
      }

      const decision = decideNextBreakRecommendation(
        facts.value.completedStandardFocusCountSinceLastCompletedLongBreak,
      );
      if (!decision.ok) {
        return failure('BREAK_RECOMMENDATION_FACTS_INVALID');
      }

      return {
        ok: true,
        value: Object.freeze({
          outcome: 'ready',
          sourceSessionId,
          recommendation: decision.value,
          completedStandardFocusCountSinceLastCompletedLongBreak:
            facts.value.completedStandardFocusCountSinceLastCompletedLongBreak,
          latestCompletedLongBreakSessionId:
            facts.value.latestCompletedLongBreak?.sessionId ?? null,
        }),
      };
    } catch {
      return failure('BREAK_RECOMMENDATION_READ_FAILED');
    }
  }
}
