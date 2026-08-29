import type {
  PersistenceResult,
  TransactionScope,
} from '@pixeldoro/application';

export type AnalyticsPropertyValue = string | number | boolean | null;
export type AnalyticsProperties = Readonly<
  Record<string, AnalyticsPropertyValue>
>;
export type AnalyticsDeliveryState = 'pending' | 'retry_wait';
export type ApprovedAnalyticsEventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'focus_setup_viewed'
  | 'focus_session_started'
  | 'focus_session_completed'
  | 'focus_session_failed'
  | 'focus_session_cancelled'
  | 'break_started'
  | 'break_completed'
  | 'reward_granted'
  | 'shop_viewed'
  | 'item_unlocked'
  | 'item_equipped'
  | 'history_viewed'
  | 'feedback_started'
  | 'feedback_submitted'
  | 'store_review_requested';

export interface AnalyticsEventRecord {
  readonly eventId: string;
  readonly eventName: ApprovedAnalyticsEventName;
  readonly properties: AnalyticsProperties;
  readonly occurredAt: number;
  readonly expiresAt: number;
  readonly deliveryState: AnalyticsDeliveryState;
  readonly attemptCount: number;
  readonly nextAttemptAt: number | null;
  readonly createdAt: number;
}

export interface UpdateAnalyticsDeliveryInput {
  readonly eventId: string;
  readonly deliveryState: AnalyticsDeliveryState;
  readonly attemptCount: number;
  readonly nextAttemptAt: number | null;
}

export interface AnalyticsEventRepository {
  findById(
    eventId: string,
  ): Promise<PersistenceResult<AnalyticsEventRecord | null>>;
  findByIdInTransaction(
    scope: TransactionScope,
    eventId: string,
  ): Promise<PersistenceResult<AnalyticsEventRecord | null>>;
  countInTransaction(
    scope: TransactionScope,
  ): Promise<PersistenceResult<number>>;
  deleteExpiredInTransaction(
    scope: TransactionScope,
    nowMs: number,
  ): Promise<PersistenceResult<number>>;
  deleteOldestInTransaction(
    scope: TransactionScope,
    count: number,
  ): Promise<PersistenceResult<number>>;
  insertInTransaction(
    scope: TransactionScope,
    record: AnalyticsEventRecord,
    nowMs: number,
  ): Promise<PersistenceResult<void>>;
  listDue(
    nowMs: number,
    limit: number,
  ): Promise<PersistenceResult<readonly AnalyticsEventRecord[]>>;
  listDueInTransaction(
    scope: TransactionScope,
    nowMs: number,
    limit: number,
  ): Promise<PersistenceResult<readonly AnalyticsEventRecord[]>>;
  updateDeliveryInTransaction(
    scope: TransactionScope,
    input: UpdateAnalyticsDeliveryInput,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
  deleteByIdsInTransaction(
    scope: TransactionScope,
    eventIds: readonly string[],
  ): Promise<PersistenceResult<number>>;
  clearInTransaction(
    scope: TransactionScope,
  ): Promise<PersistenceResult<number>>;
}
