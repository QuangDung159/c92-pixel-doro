import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type EngagementAnalyticsEventName =
  | 'focus_setup_viewed'
  | 'feedback_started'
  | 'feedback_submitted'
  | 'store_review_requested';

export interface EngagementAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

export class EngagementAnalyticsRecorder {
  constructor(private readonly dependencies: EngagementAnalyticsRecorderDependencies) {}

  record(
    eventName: EngagementAnalyticsEventName,
    subjectId: string,
    occurredAt: number,
  ): Promise<'recorded' | 'already_queued' | 'skipped'> {
    if (
      !subjectId.trim() || !Number.isSafeInteger(occurredAt) || occurredAt < 0 ||
      !Number.isSafeInteger(occurredAt + ANALYTICS_EVENT_TTL_MS)
    ) return Promise.resolve('skipped');
    try {
      if (!this.dependencies.isCaptureEnabled()) return Promise.resolve('skipped');
    } catch {
      return Promise.resolve('skipped');
    }
    return this.enqueue({
      eventId: `${eventName}:${subjectId}`,
      eventName,
      properties: Object.freeze({}),
      occurredAt,
      expiresAt: occurredAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: occurredAt,
    });
  }

  private async enqueue(event: AnalyticsEventRecord) {
    try {
      const result = await this.dependencies.queue.enqueueBounded(event, event.occurredAt);
      if (!result.ok) return 'skipped' as const;
      return result.value === 'already_queued' ? 'already_queued' as const : 'recorded' as const;
    } catch {
      return 'skipped' as const;
    }
  }
}

