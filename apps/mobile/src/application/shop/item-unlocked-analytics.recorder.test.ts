import { describe, expect, it, vi } from 'vitest';

import type { PurchaseReceiptRecord } from '@pixeldoro/application';
import { persistenceError } from '@pixeldoro/application';
import { ItemUnlockedAnalyticsRecorder } from './item-unlocked-analytics.recorder';

const receipt: PurchaseReceiptRecord = {
  id: 'receipt-1',
  profileId: 1,
  itemId: 'desk-mug',
  pricePaidCoins: 5,
  coinDelta: -5,
  reason: 'item_purchase',
  createdAt: 1_000,
};

describe('ItemUnlockedAnalyticsRecorder', () => {
  it('keys the approved event deterministically by receipt', async () => {
    const enqueueBounded = vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new ItemUnlockedAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    await expect(recorder.recordUnlocked(receipt)).resolves.toEqual({
      ok: true,
      value: { outcome: 'enqueued', eventId: 'item_unlocked:receipt-1' },
    });
    expect(enqueueBounded).toHaveBeenCalledWith({
      eventId: 'item_unlocked:receipt-1',
      eventName: 'item_unlocked',
      properties: { itemId: 'desk-mug', pricePaidCoins: 5 },
      occurredAt: 1_000,
      expiresAt: 604_801_000,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1_000,
    }, 1_000);
  });

  it('isolates disabled capture, invalid facts, and queue failure', async () => {
    const enqueueBounded = vi.fn(async () => ({
      ok: false as const,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events'),
    }));
    const disabled = new ItemUnlockedAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    await expect(disabled.recordUnlocked(receipt)).resolves.toEqual({
      ok: true, value: { outcome: 'skipped_disabled' },
    });
    expect(enqueueBounded).not.toHaveBeenCalled();

    const failing = new ItemUnlockedAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    await expect(failing.recordUnlocked({ ...receipt, coinDelta: -4 })).resolves.toMatchObject({
      ok: false, error: { code: 'ITEM_UNLOCKED_ANALYTICS_FACT_INVALID' },
    });
    await expect(failing.recordUnlocked(receipt)).resolves.toMatchObject({
      ok: false, error: { code: 'ITEM_UNLOCKED_ANALYTICS_QUEUE_FAILED' },
    });
  });
});
