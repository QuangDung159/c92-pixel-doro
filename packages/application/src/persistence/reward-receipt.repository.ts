import type { TransactionScope } from '../ports/transaction.port';
import type { PersistenceResult } from './persistence.error';

export type RewardReason =
  | 'focus_completed'
  | 'onboarding_trial_completed';

export interface RewardReceiptRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly profileId: number;
  readonly xpDelta: number;
  readonly coinDelta: number;
  readonly reason: RewardReason;
  readonly createdAt: number;
}

export interface RewardReceiptRepository {
  findById(id: string): Promise<PersistenceResult<RewardReceiptRecord | null>>;
  findBySessionId(
    sessionId: string,
  ): Promise<PersistenceResult<RewardReceiptRecord | null>>;
  findBySessionIdInTransaction(
    scope: TransactionScope,
    sessionId: string,
  ): Promise<PersistenceResult<RewardReceiptRecord | null>>;
  insertInTransaction(
    scope: TransactionScope,
    record: RewardReceiptRecord,
  ): Promise<PersistenceResult<void>>;
}
