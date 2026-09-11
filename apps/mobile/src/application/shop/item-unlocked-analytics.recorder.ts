import type { ApplicationResult, PurchaseReceiptRecord } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type ItemUnlockedAnalyticsOutcome =
  | { readonly outcome: 'enqueued' | 'already_queued'; readonly eventId: string }
  | { readonly outcome: 'skipped_disabled' };

export interface ItemUnlockedAnalyticsError {
  readonly kind: 'item_unlocked_analytics_error';
  readonly code: 'ITEM_UNLOCKED_ANALYTICS_FACT_INVALID' | 'ITEM_UNLOCKED_ANALYTICS_QUEUE_FAILED';
}

export interface ItemUnlockedAnalyticsRecorderPort {
  recordUnlocked(
    receipt: PurchaseReceiptRecord,
  ): Promise<ApplicationResult<ItemUnlockedAnalyticsOutcome, ItemUnlockedAnalyticsError>>;
}

export interface ItemUnlockedAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: ItemUnlockedAnalyticsError['code'],
): ApplicationResult<never, ItemUnlockedAnalyticsError> => ({
  ok: false,
  error: { kind: 'item_unlocked_analytics_error', code },
});

const validReceipt = (receipt: PurchaseReceiptRecord): boolean =>
  receipt.id.trim().length > 0 && receipt.itemId.trim().length > 0 &&
  receipt.profileId === 1 && receipt.reason === 'item_purchase' &&
  Number.isSafeInteger(receipt.pricePaidCoins) && receipt.pricePaidCoins > 0 &&
  receipt.coinDelta === -receipt.pricePaidCoins &&
  Number.isSafeInteger(receipt.createdAt) && receipt.createdAt >= 0 &&
  Number.isSafeInteger(receipt.createdAt + ANALYTICS_EVENT_TTL_MS);

export class ItemUnlockedAnalyticsRecorder implements ItemUnlockedAnalyticsRecorderPort {
  constructor(private readonly dependencies: ItemUnlockedAnalyticsRecorderDependencies) {}

  async recordUnlocked(
    receipt: PurchaseReceiptRecord,
  ): Promise<ApplicationResult<ItemUnlockedAnalyticsOutcome, ItemUnlockedAnalyticsError>> {
    if (!validReceipt(receipt)) return failure('ITEM_UNLOCKED_ANALYTICS_FACT_INVALID');
    let enabled: boolean;
    try {
      enabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('ITEM_UNLOCKED_ANALYTICS_QUEUE_FAILED');
    }
    if (!enabled) return { ok: true, value: { outcome: 'skipped_disabled' } };

    const event: AnalyticsEventRecord = Object.freeze({
      eventId: `item_unlocked:${receipt.id}`,
      eventName: 'item_unlocked',
      properties: Object.freeze({
        itemId: receipt.itemId,
        pricePaidCoins: receipt.pricePaidCoins,
      }),
      occurredAt: receipt.createdAt,
      expiresAt: receipt.createdAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: receipt.createdAt,
    });
    try {
      const result = await this.dependencies.queue.enqueueBounded(event, receipt.createdAt);
      if (!result.ok) return failure('ITEM_UNLOCKED_ANALYTICS_QUEUE_FAILED');
      return { ok: true, value: { outcome: result.value, eventId: event.eventId } };
    } catch {
      return failure('ITEM_UNLOCKED_ANALYTICS_QUEUE_FAILED');
    }
  }
}
