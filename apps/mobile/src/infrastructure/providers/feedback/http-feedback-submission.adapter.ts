import type {
  FeedbackSubmission,
  FeedbackSubmissionPort,
} from '@/application';
import { validateFeedbackSubmission } from '@/application';

export const FEEDBACK_REQUEST_TIMEOUT_MS = 10_000;

export interface FeedbackEndpointConfig {
  readonly endpoint: string;
  readonly runtime: 'preview' | 'production';
}

export const resolveFeedbackEndpointConfig = (
  environment: Readonly<Record<string, string | undefined>>,
): FeedbackEndpointConfig | null => {
  const endpoint = environment.EXPO_PUBLIC_FEEDBACK_ENDPOINT?.trim();
  const runtime = environment.EXPO_PUBLIC_FEEDBACK_RUNTIME?.trim();
  if (!endpoint || (runtime !== 'preview' && runtime !== 'production')) return null;
  try {
    const url = new URL(endpoint);
    if (
      url.protocol !== 'https:' || url.username || url.password || url.hash ||
      !url.hostname
    ) return null;
  } catch {
    return null;
  }
  return { endpoint, runtime };
};

export class HttpFeedbackSubmissionAdapter implements FeedbackSubmissionPort {
  constructor(
    private readonly config: FeedbackEndpointConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async submit(input: FeedbackSubmission) {
    if (!validateFeedbackSubmission(input)) return 'rejected' as const;
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), FEEDBACK_REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetcher(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': input.submissionId,
        },
        body: JSON.stringify(input),
        signal: abort.signal,
      });
      if (response.ok) return 'accepted' as const;
      return response.status === 408 || response.status === 429 || response.status >= 500
        ? 'retryable' as const
        : 'rejected' as const;
    } catch {
      return 'retryable' as const;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class DisabledFeedbackSubmissionAdapter implements FeedbackSubmissionPort {
  submit(): Promise<'unavailable'> {
    return Promise.resolve('unavailable');
  }
}
