import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS_EVENT_TTL_MS, type AnalyticsEventRecord } from '../persistence';
import { OnboardingAnalyticsRecorder } from './onboarding-analytics.recorder';

describe('OnboardingAnalyticsRecorder', () => {
  it('records deterministic started and completed milestones with exact private shape', async () => {
    const events: AnalyticsEventRecord[] = [];
    const recorder = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: {
        enqueueBounded: async (event) => {
          events.push(event);
          return { ok: true, value: 'enqueued' };
        },
      },
    });

    await expect(recorder.recordStarted('trial-1', 1_000)).resolves.toEqual({
      ok: true,
      value: { outcome: 'enqueued', eventId: 'onboarding_started:trial-1' },
    });
    await expect(recorder.recordCompleted(301_000)).resolves.toEqual({
      ok: true,
      value: {
        outcome: 'enqueued',
        eventId: 'onboarding_completed:1:301000',
      },
    });
    expect(events).toEqual([
      {
        eventId: 'onboarding_started:trial-1',
        eventName: 'onboarding_started',
        properties: {},
        occurredAt: 1_000,
        expiresAt: 1_000 + ANALYTICS_EVENT_TTL_MS,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: 1_000,
      },
      {
        eventId: 'onboarding_completed:1:301000',
        eventName: 'onboarding_completed',
        properties: {},
        occurredAt: 301_000,
        expiresAt: 301_000 + ANALYTICS_EVENT_TTL_MS,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: 301_000,
      },
    ]);
    expect(events.every((event) => Object.keys(event.properties).length === 0)).toBe(true);
  });

  it('skips opt-out milestones without queueing and never backfills them', async () => {
    const enqueueBounded = vi.fn();
    let enabled = false;
    const recorder = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => enabled,
      queue: { enqueueBounded },
    });

    await expect(recorder.recordStarted('trial-opt-out', 2_000)).resolves.toEqual({
      ok: true,
      value: { outcome: 'skipped_disabled' },
    });
    enabled = true;
    expect(enqueueBounded).not.toHaveBeenCalled();
  });

  it('accepts queue dedupe and maps queue errors or throws to a finite error', async () => {
    const already = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: {
        enqueueBounded: async () => ({ ok: true, value: 'already_queued' }),
      },
    });
    await expect(already.recordStarted('same', 3_000)).resolves.toMatchObject({
      ok: true,
      value: { outcome: 'already_queued' },
    });

    const rejected = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: {
        enqueueBounded: async () => ({
          ok: false,
          error: {
            kind: 'persistence_error',
            code: 'PERSISTENCE_WRITE_FAILED',
            entity: 'analytics_events',
            field: null,
          },
        }),
      },
    });
    await expect(rejected.recordCompleted(4_000)).resolves.toEqual({
      ok: false,
      error: {
        kind: 'onboarding_analytics_record_error',
        code: 'ONBOARDING_ANALYTICS_QUEUE_FAILED',
      },
    });

    const thrown = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded: async () => { throw new Error('offline'); } },
    });
    await expect(thrown.recordCompleted(4_001)).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_ANALYTICS_QUEUE_FAILED' },
    });
  });

  it.each([
    ['', 1],
    [' ', 1],
    ['trial', -1],
    ['trial', Number.MAX_SAFE_INTEGER],
    ['trial', 1.5],
  ])('rejects invalid started fact %#', async (sessionId, startedAt) => {
    const recorder = new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: { enqueueBounded: vi.fn() },
    });
    await expect(recorder.recordStarted(sessionId, startedAt)).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_ANALYTICS_FACT_INVALID' },
    });
  });
});
