import { describe, expect, it, vi } from 'vitest';

import { EngagementAnalyticsRecorder } from './engagement-analytics.recorder';

describe('EngagementAnalyticsRecorder', () => {
  it('records a canonical empty-payload event with a stable dedupe id', async () => {
    const enqueueBounded = vi.fn().mockResolvedValue({
      ok: true,
      value: 'enqueued',
    });
    const recorder = new EngagementAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    await expect(recorder.record('focus_setup_viewed', 'episode-1', 1_000))
      .resolves.toBe('recorded');
    expect(enqueueBounded).toHaveBeenCalledWith({
      eventId: 'focus_setup_viewed:episode-1',
      eventName: 'focus_setup_viewed',
      properties: {},
      occurredAt: 1_000,
      expiresAt: 604_801_000,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1_000,
    }, 1_000);
  });

  it('does not touch the queue while capture is disabled', async () => {
    const enqueueBounded = vi.fn();
    const recorder = new EngagementAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    await expect(recorder.record('feedback_started', 'episode-1', 1_000))
      .resolves.toBe('skipped');
    expect(enqueueBounded).not.toHaveBeenCalled();
  });
});
