import { describe, expect, it, vi } from 'vitest';

import {
  PostHogAnalyticsDeliveryAdapter,
  resolvePostHogAnalyticsConfig,
} from './posthog-analytics-delivery.adapter';

describe('PostHogAnalyticsDeliveryAdapter', () => {
  it('fails closed unless the key, EU host, and explicit runtime are valid', () => {
    expect(resolvePostHogAnalyticsConfig({})).toBeNull();
    expect(resolvePostHogAnalyticsConfig({
      EXPO_PUBLIC_POSTHOG_KEY: 'phc_test',
      EXPO_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
      EXPO_PUBLIC_ANALYTICS_RUNTIME: 'production',
    })).toBeNull();
    expect(resolvePostHogAnalyticsConfig({
      EXPO_PUBLIC_POSTHOG_KEY: ' phc_test ',
      EXPO_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
      EXPO_PUBLIC_ANALYTICS_RUNTIME: 'preview',
    })).toEqual({
      apiKey: 'phc_test',
      host: 'https://eu.i.posthog.com',
      runtime: 'preview',
    });
  });

  it('sends the exact approved event envelope without free text', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {
      status: 200,
    }));
    const adapter = new PostHogAnalyticsDeliveryAdapter({
      apiKey: 'phc_test',
      host: 'https://eu.i.posthog.com',
      runtime: 'production',
    }, fetcher);

    await expect(adapter.deliver({
      anonymousId: 'install-1',
      events: [{
        eventId: 'event-1',
        eventName: 'focus_session_completed',
        occurredAt: 1_700_000_000_000,
        properties: {
          mode: 'strict',
          durationMinutes: 25,
          workTag: 'coding',
          terminalStatus: 'completed',
        },
        expiresAt: 1_700_604_800_000,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: 1_700_000_000_000,
      }],
    })).resolves.toBe('accepted');

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, request] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://eu.i.posthog.com/batch/');
    expect(request).toMatchObject({ method: 'POST', signal: expect.any(AbortSignal) });
    expect(JSON.parse(String(request?.body))).toEqual({
      api_key: 'phc_test',
      batch: [{
        event: 'focus_session_completed',
        properties: {
          distinct_id: 'install-1',
          $insert_id: 'event-1',
          $process_person_profile: false,
          mode: 'strict',
          durationMinutes: 25,
          workTag: 'coding',
          terminalStatus: 'completed',
        },
        timestamp: '2023-11-14T22:13:20.000Z',
      }],
    });
    expect(String(request?.body)).not.toContain('comment');
  });

  it('keeps invalid payloads and provider failures retryable', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {
      status: 500,
    }));
    const adapter = new PostHogAnalyticsDeliveryAdapter({
      apiKey: 'phc_test',
      host: 'https://eu.i.posthog.com',
      runtime: 'production',
    }, fetcher);

    await expect(adapter.deliver({
      anonymousId: 'install-1',
      events: [{
        eventId: 'event-invalid',
        eventName: 'feedback_submitted',
        occurredAt: 1,
        properties: { comment: 'must never leave the device' },
        expiresAt: 2,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: 1,
      }],
    })).resolves.toBe('retryable');
    expect(fetcher).not.toHaveBeenCalled();

    await expect(adapter.deliver({
      anonymousId: 'install-1',
      events: [{
        eventId: 'event-2',
        eventName: 'feedback_submitted',
        occurredAt: 2,
        properties: {},
        expiresAt: 3,
        deliveryState: 'pending',
        attemptCount: 0,
        nextAttemptAt: null,
        createdAt: 2,
      }],
    })).resolves.toBe('retryable');
  });
});
