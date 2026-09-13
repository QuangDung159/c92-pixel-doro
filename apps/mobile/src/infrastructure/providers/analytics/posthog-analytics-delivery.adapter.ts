import type {
  AnalyticsDeliveryBatch,
  AnalyticsDeliveryPort,
} from '@/application';
import { validateAnalyticsEventPayload } from '@/application';

const POSTHOG_EU_HOST = 'https://eu.i.posthog.com';
export const POSTHOG_REQUEST_TIMEOUT_MS = 10_000;

export interface PostHogAnalyticsConfig {
  readonly apiKey: string;
  readonly host: typeof POSTHOG_EU_HOST;
  readonly runtime: 'preview' | 'production';
}

export const resolvePostHogAnalyticsConfig = (
  environment: Readonly<Record<string, string | undefined>>,
): PostHogAnalyticsConfig | null => {
  const apiKey = environment.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  const host = environment.EXPO_PUBLIC_POSTHOG_HOST?.trim();
  const runtime = environment.EXPO_PUBLIC_ANALYTICS_RUNTIME?.trim();
  if (
    !apiKey || host !== POSTHOG_EU_HOST ||
    (runtime !== 'preview' && runtime !== 'production')
  ) return null;
  return { apiKey, host, runtime };
};

export class PostHogAnalyticsDeliveryAdapter implements AnalyticsDeliveryPort {
  constructor(
    private readonly config: PostHogAnalyticsConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async deliver(batch: AnalyticsDeliveryBatch): Promise<'accepted' | 'retryable'> {
    if (
      !batch.anonymousId.trim() || batch.events.length < 1 || batch.events.length > 20 ||
      batch.events.some((event) => !validateAnalyticsEventPayload(
        event.eventName,
        event.properties,
      ))
    ) return 'retryable';

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), POSTHOG_REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetcher(`${this.config.host}/batch/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          batch: batch.events.map((event) => ({
            event: event.eventName,
            properties: {
              distinct_id: batch.anonymousId,
              $insert_id: event.eventId,
              $process_person_profile: false,
              ...event.properties,
            },
            timestamp: new Date(event.occurredAt).toISOString(),
          })),
        }),
        signal: abort.signal,
      });
      return response.ok ? 'accepted' : 'retryable';
    } catch {
      return 'retryable';
    } finally {
      clearTimeout(timeout);
    }
  }
}
