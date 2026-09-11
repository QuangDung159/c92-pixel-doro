import type { ApplicationResult, OwnedItemRecord } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type ItemEquippedAnalyticsOutcome =
  | { readonly outcome: 'enqueued' | 'already_queued'; readonly eventId: string }
  | { readonly outcome: 'skipped_disabled' };

export interface ItemEquippedAnalyticsError {
  readonly kind: 'item_equipped_analytics_error';
  readonly code: 'ITEM_EQUIPPED_ANALYTICS_FACT_INVALID' | 'ITEM_EQUIPPED_ANALYTICS_QUEUE_FAILED';
}

export interface ItemEquippedAnalyticsRecorderPort {
  recordEquipped(
    ownership: OwnedItemRecord,
  ): Promise<ApplicationResult<ItemEquippedAnalyticsOutcome, ItemEquippedAnalyticsError>>;
}

export interface ItemEquippedAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: ItemEquippedAnalyticsError['code'],
): ApplicationResult<never, ItemEquippedAnalyticsError> => ({
  ok: false,
  error: { kind: 'item_equipped_analytics_error', code },
});

const validOwnership = (ownership: OwnedItemRecord): ownership is OwnedItemRecord & {
  readonly equippedAt: number;
} => ownership.profileId === 1 && ownership.itemId.trim().length > 0 &&
  ownership.purchaseTransactionId.trim().length > 0 && ownership.isEquipped &&
  Number.isSafeInteger(ownership.equippedAt) && ownership.equippedAt !== null &&
  ownership.equippedAt >= 0 && ownership.updatedAt === ownership.equippedAt &&
  Number.isSafeInteger(ownership.equippedAt + ANALYTICS_EVENT_TTL_MS);

export class ItemEquippedAnalyticsRecorder implements ItemEquippedAnalyticsRecorderPort {
  constructor(private readonly dependencies: ItemEquippedAnalyticsRecorderDependencies) {}

  async recordEquipped(
    ownership: OwnedItemRecord,
  ): Promise<ApplicationResult<ItemEquippedAnalyticsOutcome, ItemEquippedAnalyticsError>> {
    if (!validOwnership(ownership)) return failure('ITEM_EQUIPPED_ANALYTICS_FACT_INVALID');
    let enabled: boolean;
    try {
      enabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('ITEM_EQUIPPED_ANALYTICS_QUEUE_FAILED');
    }
    if (!enabled) return { ok: true, value: { outcome: 'skipped_disabled' } };

    const event: AnalyticsEventRecord = Object.freeze({
      eventId: `item_equipped:${ownership.itemId}:${ownership.equippedAt}`,
      eventName: 'item_equipped',
      properties: Object.freeze({ itemId: ownership.itemId }),
      occurredAt: ownership.equippedAt,
      expiresAt: ownership.equippedAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: ownership.equippedAt,
    });
    try {
      const result = await this.dependencies.queue.enqueueBounded(event, ownership.equippedAt);
      if (!result.ok) return failure('ITEM_EQUIPPED_ANALYTICS_QUEUE_FAILED');
      return { ok: true, value: { outcome: result.value, eventId: event.eventId } };
    } catch {
      return failure('ITEM_EQUIPPED_ANALYTICS_QUEUE_FAILED');
    }
  }
}
