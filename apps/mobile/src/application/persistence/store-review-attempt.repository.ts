import type { PersistenceResult } from '@pixeldoro/application';

export interface StoreReviewAttemptRecord {
  readonly id: string;
  readonly appVersion: string;
  readonly attemptedAt: number;
  readonly createdAt: number;
}

export interface StoreReviewAttemptRepository {
  findByAppVersion(
    appVersion: string,
  ): Promise<PersistenceResult<StoreReviewAttemptRecord | null>>;
  list(): Promise<PersistenceResult<readonly StoreReviewAttemptRecord[]>>;
  insert(
    record: StoreReviewAttemptRecord,
  ): Promise<PersistenceResult<void>>;
}
