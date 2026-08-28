import type { PersistenceResult } from '@pixeldoro/application';

export type AnalyticsPropertyValue = string | number | boolean | null;
export type AnalyticsProperties = Readonly<
  Record<string, AnalyticsPropertyValue>
>;
export type AnalyticsDeliveryState = 'pending' | 'retry_wait';

export interface AnalyticsEventRecord {
  readonly eventId: string;
  readonly eventName: string;
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
  listPending(
    limit: number,
  ): Promise<PersistenceResult<readonly AnalyticsEventRecord[]>>;
  insert(record: AnalyticsEventRecord): Promise<PersistenceResult<void>>;
  updateDelivery(
    input: UpdateAnalyticsDeliveryInput,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
}
