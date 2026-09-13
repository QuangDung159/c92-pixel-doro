import { describe, expect, it, vi } from 'vitest';

import {
  HttpFeedbackSubmissionAdapter,
  resolveFeedbackEndpointConfig,
} from './http-feedback-submission.adapter';

const submission = {
  submissionId: 'feedback-1',
  score: 4 as const,
  comment: 'Rất dễ dùng',
  appVersion: '0.1.0',
  platform: 'ios' as const,
};

describe('HttpFeedbackSubmissionAdapter', () => {
  it('fails closed for missing, insecure, or ambiguous configuration', () => {
    expect(resolveFeedbackEndpointConfig({})).toBeNull();
    expect(resolveFeedbackEndpointConfig({
      EXPO_PUBLIC_FEEDBACK_ENDPOINT: 'http://example.test/feedback',
      EXPO_PUBLIC_FEEDBACK_RUNTIME: 'production',
    })).toBeNull();
    expect(resolveFeedbackEndpointConfig({
      EXPO_PUBLIC_FEEDBACK_ENDPOINT: 'https://user:secret@example.test/feedback',
      EXPO_PUBLIC_FEEDBACK_RUNTIME: 'production',
    })).toBeNull();
    expect(resolveFeedbackEndpointConfig({
      EXPO_PUBLIC_FEEDBACK_ENDPOINT: 'https://example.test/feedback',
    })).toBeNull();
    expect(resolveFeedbackEndpointConfig({
      EXPO_PUBLIC_FEEDBACK_ENDPOINT: ' https://example.test/feedback ',
      EXPO_PUBLIC_FEEDBACK_RUNTIME: 'preview',
    })).toEqual({
      endpoint: 'https://example.test/feedback',
      runtime: 'preview',
    });
  });

  it('submits the exact body with an idempotency key', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {
      status: 202,
    }));
    const adapter = new HttpFeedbackSubmissionAdapter({
      endpoint: 'https://example.test/feedback',
      runtime: 'production',
    }, fetcher);

    await expect(adapter.submit(submission)).resolves.toBe('accepted');
    expect(fetcher).toHaveBeenCalledWith('https://example.test/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'feedback-1',
      },
      body: JSON.stringify(submission),
      signal: expect.any(AbortSignal),
    });
  });

  it('rejects extra fields before contacting the provider', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = new HttpFeedbackSubmissionAdapter({
      endpoint: 'https://example.test/feedback',
      runtime: 'production',
    }, fetcher);
    await expect(adapter.submit({
      ...submission,
      sessionId: 'must-not-leak',
    } as never)).resolves.toBe('rejected');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [408, 'retryable'],
    [429, 'retryable'],
    [503, 'retryable'],
    [400, 'rejected'],
  ] as const)('classifies HTTP %s as %s', async (status, outcome) => {
    const adapter = new HttpFeedbackSubmissionAdapter({
      endpoint: 'https://example.test/feedback',
      runtime: 'production',
    }, vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status })));
    await expect(adapter.submit(submission)).resolves.toBe(outcome);
  });

  it('treats transport failures as retryable', async () => {
    const adapter = new HttpFeedbackSubmissionAdapter({
      endpoint: 'https://example.test/feedback',
      runtime: 'production',
    }, vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));
    await expect(adapter.submit(submission)).resolves.toBe('retryable');
  });
});
