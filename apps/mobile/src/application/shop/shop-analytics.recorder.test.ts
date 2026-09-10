import { describe, expect, it, vi } from 'vitest';

import { persistenceError } from '@pixeldoro/application';
import { ShopAnalyticsRecorder } from './shop-analytics.recorder';

describe('ShopAnalyticsRecorder', () => {
  it('records the approved empty-property view event', async () => {
    const enqueueBounded = vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new ShopAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    await expect(recorder.recordViewed('episode-1', 1_000)).resolves.toEqual({
      ok: true,
      value: { outcome: 'enqueued', eventId: 'shop_viewed:episode-1' },
    });
    expect(enqueueBounded).toHaveBeenCalledWith({
      eventId: 'shop_viewed:episode-1',
      eventName: 'shop_viewed',
      properties: {},
      occurredAt: 1_000,
      expiresAt: 604_801_000,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1_000,
    }, 1_000);
  });

  it('skips disabled capture and isolates invalid or failed writes', async () => {
    const enqueueBounded = vi.fn(async () => ({
      ok: false as const,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events'),
    }));
    const disabled = new ShopAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    await expect(disabled.recordViewed('episode-1', 1_000)).resolves.toEqual({
      ok: true,
      value: { outcome: 'skipped_disabled' },
    });
    expect(enqueueBounded).not.toHaveBeenCalled();

    const failing = new ShopAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    await expect(failing.recordViewed('episode-1', 1_000)).resolves.toMatchObject({
      ok: false,
      error: { code: 'SHOP_ANALYTICS_QUEUE_FAILED' },
    });
    await expect(failing.recordViewed('', 1_000)).resolves.toMatchObject({
      ok: false,
      error: { code: 'SHOP_ANALYTICS_FACT_INVALID' },
    });
  });
});
