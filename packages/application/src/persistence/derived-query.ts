import type { PersistenceResult } from './persistence.error';
import type {
  FocusMode,
  SessionStatus,
  WorkTag,
} from './session.repository';

export interface StandardFocusHistoryCursor {
  readonly endsAt: number;
  readonly id: string;
}

export interface StandardFocusHistoryInput {
  readonly profileId: number;
  readonly limit: number;
  readonly cursor: StandardFocusHistoryCursor | null;
}

export interface StandardFocusHistoryEntry {
  readonly id: string;
  readonly status: Exclude<SessionStatus, 'running'>;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
  readonly configuredDurationMinutes: number;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly resolvedAt: number;
  readonly scheduledEndLocalDate: string;
  readonly scheduledEndUtcOffsetMinutes: number;
}

export interface StandardFocusHistoryPage {
  readonly entries: readonly StandardFocusHistoryEntry[];
  readonly nextCursor: StandardFocusHistoryCursor | null;
}

export interface StandardFocusHistoryQuery {
  list(
    input: StandardFocusHistoryInput,
  ): Promise<PersistenceResult<StandardFocusHistoryPage>>;
}

export interface ContributionRangeInput {
  readonly profileId: number;
  readonly startLocalDate: string;
  readonly endLocalDate: string;
}

export interface ContributionDayFact {
  readonly scheduledEndLocalDate: string;
  readonly totalCompletedMinutes: number;
  readonly completedSessionCount: number;
}

export interface ContributionQuery {
  listRange(
    input: ContributionRangeInput,
  ): Promise<PersistenceResult<readonly ContributionDayFact[]>>;
}

export interface CompletedLongBreakFact {
  readonly sessionId: string;
  readonly resolvedAt: number;
}

export interface LongBreakCadenceFacts {
  readonly profileId: number;
  readonly completedStandardFocusCountSinceLastCompletedLongBreak: number;
  readonly latestCompletedLongBreak: CompletedLongBreakFact | null;
}

export interface LongBreakCadenceQuery {
  getFacts(
    profileId: number,
  ): Promise<PersistenceResult<LongBreakCadenceFacts>>;
}

export interface EconomyConsistencySnapshot {
  readonly profileId: number;
  readonly totalXp: number;
  readonly coinBalance: number;
}

export interface EconomyConsistencyQuery {
  verify(
    profileId: number,
  ): Promise<PersistenceResult<EconomyConsistencySnapshot>>;
}
