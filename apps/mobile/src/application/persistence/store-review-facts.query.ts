import type { PersistenceResult } from '@pixeldoro/application';

export interface StoreReviewFactsInput {
  readonly profileId: number;
  readonly appVersion: string;
  readonly nowMs: number;
}

export interface LatestStoreReviewAttemptFact {
  readonly id: string;
  readonly appVersion: string;
  readonly attemptedAt: number;
}

export interface StoreReviewFacts {
  readonly installedAt: number;
  readonly completedStandardFocusCount: number;
  readonly distinctStandardFocusActiveDayCount: number;
  readonly latestAttempt: LatestStoreReviewAttemptFact | null;
  readonly rolling365DayAttemptCount: number;
  readonly currentVersionAttempted: boolean;
}

export interface StoreReviewFactsQuery {
  getFacts(
    input: StoreReviewFactsInput,
  ): Promise<PersistenceResult<StoreReviewFacts>>;
}
