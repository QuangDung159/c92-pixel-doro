import { describe, expect, it, vi } from 'vitest';

import { persistenceError } from '@pixeldoro/application';

import { ANALYTICS_EVENT_TTL_MS } from '../persistence';
import { HistoryAnalyticsRecorder } from './history-analytics.recorder';

describe('HistoryAnalyticsRecorder', () => {
  it('enqueues the exact approved empty-property view event', async () => {
    const enqueueBounded = vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const }));
    const recorder = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });

    await expect(recorder.recordViewed('episode-1', 1_000)).resolves.toEqual({
      ok: true,
      value: { outcome: 'enqueued', eventId: 'history_viewed:episode-1' },
    });
    expect(enqueueBounded).toHaveBeenCalledExactlyOnceWith({
      eventId: 'history_viewed:episode-1',
      eventName: 'history_viewed',
      properties: {},
      occurredAt: 1_000,
      expiresAt: 1_000 + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1_000,
    }, 1_000);
  });

  it('returns duplicate outcome and skips disabled capture without backfill', async () => {
    const enqueueBounded = vi.fn(async () => ({
      ok: true as const,
      value: 'already_queued' as const,
    }));
    const enabled = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded },
    });
    await expect(enabled.recordViewed('same', 1_000)).resolves.toMatchObject({
      ok: true, value: { outcome: 'already_queued', eventId: 'history_viewed:same' },
    });

    const disabled = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => false,
      queue: { enqueueBounded },
    });
    await expect(disabled.recordViewed('disabled', 2_000)).resolves.toEqual({
      ok: true, value: { outcome: 'skipped_disabled' },
    });
    expect(enqueueBounded).toHaveBeenCalledTimes(1);
  });

  it('isolates invalid facts, settings errors, queue rejection and queue throws', async () => {
    const rejected = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded: async () => ({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events'),
      }) },
    });
    await expect(rejected.recordViewed('', 1_000)).resolves.toMatchObject({
      ok: false, error: { code: 'HISTORY_ANALYTICS_FACT_INVALID' },
    });
    await expect(rejected.recordViewed('episode', Number.MAX_SAFE_INTEGER)).resolves.toMatchObject({
      ok: false, error: { code: 'HISTORY_ANALYTICS_FACT_INVALID' },
    });
    await expect(rejected.recordViewed('episode', 1_000)).resolves.toMatchObject({
      ok: false, error: { code: 'HISTORY_ANALYTICS_QUEUE_FAILED' },
    });

    const settingsThrow = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => { throw new Error('settings'); },
      queue: { enqueueBounded: vi.fn() },
    });
    await expect(settingsThrow.recordViewed('episode', 1_000)).resolves.toMatchObject({
      ok: false, error: { code: 'HISTORY_ANALYTICS_QUEUE_FAILED' },
    });

    const queueThrow = new HistoryAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded: async () => { throw new Error('queue'); } },
    });
    await expect(queueThrow.recordViewed('episode', 1_000)).resolves.toMatchObject({
      ok: false, error: { code: 'HISTORY_ANALYTICS_QUEUE_FAILED' },
    });
  });
});
