import type { TransactionScope } from '../ports/transaction.port';
import type { FocusMode, WorkTag } from '@pixeldoro/domain';
import type {
  ConditionalWriteOutcome,
  PersistenceResult,
} from './persistence.error';

export type SessionType = 'focus' | 'short_break' | 'long_break';
export type FocusVariant = 'standard' | 'onboarding_trial';
export type SessionStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type { FocusMode, WorkTag };

export interface SessionRecord {
  readonly id: string;
  readonly profileId: number;
  readonly sessionType: SessionType;
  readonly focusVariant: FocusVariant | null;
  readonly mode: FocusMode | null;
  readonly status: SessionStatus;
  readonly workTag: WorkTag | null;
  readonly configuredDurationMinutes: number;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly backgroundedAt: number | null;
  readonly resolvedAt: number | null;
  readonly xpEarned: number;
  readonly coinsEarned: number;
  readonly rewardClaimedAt: number | null;
  readonly scheduledEndLocalDate: string;
  readonly scheduledEndUtcOffsetMinutes: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type RunningSessionRecord = SessionRecord & {
  readonly status: 'running';
  readonly resolvedAt: null;
  readonly xpEarned: 0;
  readonly coinsEarned: 0;
  readonly rewardClaimedAt: null;
};

export interface RecordSessionBackgroundInput {
  readonly sessionId: string;
  readonly backgroundedAt: number;
  readonly updatedAt: number;
}

export interface ClearSessionBackgroundInput {
  readonly sessionId: string;
  readonly expectedBackgroundedAt: number;
  readonly updatedAt: number;
}

export interface TransitionSessionInput {
  readonly sessionId: string;
  readonly status: Exclude<SessionStatus, 'running'>;
  readonly resolvedAt: number;
  readonly xpEarned: number;
  readonly coinsEarned: number;
  readonly rewardClaimedAt: number | null;
  readonly updatedAt: number;
}

export interface SessionRepository {
  findById(id: string): Promise<PersistenceResult<SessionRecord | null>>;
  findActive(): Promise<PersistenceResult<SessionRecord | null>>;
  findLatestOnboardingTrial(): Promise<PersistenceResult<SessionRecord | null>>;
  findByIdInTransaction(
    scope: TransactionScope,
    id: string,
  ): Promise<PersistenceResult<SessionRecord | null>>;
  findActiveInTransaction(
    scope: TransactionScope,
  ): Promise<PersistenceResult<SessionRecord | null>>;
  insertRunningInTransaction(
    scope: TransactionScope,
    record: RunningSessionRecord,
  ): Promise<PersistenceResult<void>>;
  recordBackgroundedAtInTransaction(
    scope: TransactionScope,
    input: RecordSessionBackgroundInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
  clearBackgroundedAtInTransaction(
    scope: TransactionScope,
    input: ClearSessionBackgroundInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
  transitionFromRunningInTransaction(
    scope: TransactionScope,
    input: TransitionSessionInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
}
