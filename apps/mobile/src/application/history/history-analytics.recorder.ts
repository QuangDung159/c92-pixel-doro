import type { ApplicationResult } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type HistoryAnalyticsOutcome =
  | { readonly outcome: 'enqueued' | 'already_queued'; readonly eventId: string }
  | { readonly outcome: 'skipped_disabled' };

export interface HistoryAnalyticsError {
  readonly kind: 'history_analytics_error';
  readonly code: 'HISTORY_ANALYTICS_FACT_INVALID' | 'HISTORY_ANALYTICS_QUEUE_FAILED';
}

export interface HistoryAnalyticsRecorderPort {
  recordViewed(
    focusEpisodeId: string,
    occurredAt: number,
  ): Promise<ApplicationResult<HistoryAnalyticsOutcome, HistoryAnalyticsError>>;
}

export interface HistoryAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: HistoryAnalyticsError['code'],
): ApplicationResult<never, HistoryAnalyticsError> => ({
  ok: false,
  error: { kind: 'history_analytics_error', code },
});

const validTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 &&
  Number.isSafeInteger(value + ANALYTICS_EVENT_TTL_MS);

export class HistoryAnalyticsRecorder implements HistoryAnalyticsRecorderPort {
  constructor(private readonly dependencies: HistoryAnalyticsRecorderDependencies) {}

  async recordViewed(
    focusEpisodeId: string,
    occurredAt: number,
  ): Promise<ApplicationResult<HistoryAnalyticsOutcome, HistoryAnalyticsError>> {
    if (focusEpisodeId.trim().length === 0 || !validTimestamp(occurredAt)) {
      return failure('HISTORY_ANALYTICS_FACT_INVALID');
    }
    let enabled: boolean;
    try {
      enabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('HISTORY_ANALYTICS_QUEUE_FAILED');
    }
    if (!enabled) return { ok: true, value: { outcome: 'skipped_disabled' } };

    const event: AnalyticsEventRecord = Object.freeze({
      eventId: `history_viewed:${focusEpisodeId}`,
      eventName: 'history_viewed',
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
      if (!result.ok) return failure('HISTORY_ANALYTICS_QUEUE_FAILED');
      return { ok: true, value: { outcome: result.value, eventId: event.eventId } };
    } catch {
      return failure('HISTORY_ANALYTICS_QUEUE_FAILED');
    }
  }
}
