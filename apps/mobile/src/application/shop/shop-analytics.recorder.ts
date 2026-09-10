import type { ApplicationResult } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type ShopAnalyticsOutcome =
  | { readonly outcome: 'enqueued' | 'already_queued'; readonly eventId: string }
  | { readonly outcome: 'skipped_disabled' };

export interface ShopAnalyticsError {
  readonly kind: 'shop_analytics_error';
  readonly code: 'SHOP_ANALYTICS_FACT_INVALID' | 'SHOP_ANALYTICS_QUEUE_FAILED';
}

export interface ShopAnalyticsRecorderPort {
  recordViewed(
    focusEpisodeId: string,
    occurredAt: number,
  ): Promise<ApplicationResult<ShopAnalyticsOutcome, ShopAnalyticsError>>;
}

export interface ShopAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: ShopAnalyticsError['code'],
): ApplicationResult<never, ShopAnalyticsError> => ({
  ok: false,
  error: { kind: 'shop_analytics_error', code },
});

const validTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 &&
  Number.isSafeInteger(value + ANALYTICS_EVENT_TTL_MS);

export class ShopAnalyticsRecorder implements ShopAnalyticsRecorderPort {
  constructor(private readonly dependencies: ShopAnalyticsRecorderDependencies) {}

  async recordViewed(
    focusEpisodeId: string,
    occurredAt: number,
  ): Promise<ApplicationResult<ShopAnalyticsOutcome, ShopAnalyticsError>> {
    if (focusEpisodeId.trim().length === 0 || !validTimestamp(occurredAt)) {
      return failure('SHOP_ANALYTICS_FACT_INVALID');
    }
    let enabled: boolean;
    try {
      enabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('SHOP_ANALYTICS_QUEUE_FAILED');
    }
    if (!enabled) return { ok: true, value: { outcome: 'skipped_disabled' } };

    const event: AnalyticsEventRecord = Object.freeze({
      eventId: `shop_viewed:${focusEpisodeId}`,
      eventName: 'shop_viewed',
      properties: Object.freeze({}),
      occurredAt,
      expiresAt: occurredAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: occurredAt,
    });
    try {
      const result = await this.dependencies.queue.enqueueBounded(event, occurredAt);
      if (!result.ok) return failure('SHOP_ANALYTICS_QUEUE_FAILED');
      return {
        ok: true,
        value: { outcome: result.value, eventId: event.eventId },
      };
    } catch {
      return failure('SHOP_ANALYTICS_QUEUE_FAILED');
    }
  }
}
