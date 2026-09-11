import { describe, expect, it, vi } from 'vitest';

import { persistenceError, type OwnedItemRecord } from '@pixeldoro/application';
import { ItemEquippedAnalyticsRecorder } from './item-equipped-analytics.recorder';

const ownership: OwnedItemRecord = {
  profileId: 1, itemId: 'desk-mug', purchaseTransactionId: 'receipt-1',
  unlockedAt: 100, isEquipped: true, equippedAt: 1_000, updatedAt: 1_000,
};

describe('ItemEquippedAnalyticsRecorder', () => {
  it('records the deterministic approved fresh-equip event', async () => {
    const enqueueBounded = vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new ItemEquippedAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    await expect(recorder.recordEquipped(ownership)).resolves.toEqual({
      ok: true,
      value: { outcome: 'enqueued', eventId: 'item_equipped:desk-mug:1000' },
    });
    expect(enqueueBounded).toHaveBeenCalledWith({
      eventId: 'item_equipped:desk-mug:1000', eventName: 'item_equipped',
      properties: { itemId: 'desk-mug' }, occurredAt: 1_000, expiresAt: 604_801_000,
      deliveryState: 'pending', attemptCount: 0, nextAttemptAt: null, createdAt: 1_000,
    }, 1_000);
  });

  it('isolates disabled, unequipped and queue failure paths', async () => {
    const enqueueBounded = vi.fn(async () => ({
      ok: false as const,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events'),
    }));
    const disabled = new ItemEquippedAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    await expect(disabled.recordEquipped(ownership)).resolves.toEqual({
      ok: true, value: { outcome: 'skipped_disabled' },
    });
    expect(enqueueBounded).not.toHaveBeenCalled();

    const failing = new ItemEquippedAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    await expect(failing.recordEquipped({
      ...ownership, isEquipped: false, equippedAt: null,
    })).resolves.toMatchObject({
      ok: false, error: { code: 'ITEM_EQUIPPED_ANALYTICS_FACT_INVALID' },
    });
    await expect(failing.recordEquipped(ownership)).resolves.toMatchObject({
      ok: false, error: { code: 'ITEM_EQUIPPED_ANALYTICS_QUEUE_FAILED' },
    });
  });
});
