import type { ApplicationResult } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type OnboardingAnalyticsRecordOutcome =
  | {
      readonly outcome: 'enqueued' | 'already_queued';
      readonly eventId: string;
    }
  | { readonly outcome: 'skipped_disabled' };

export type OnboardingAnalyticsRecordErrorCode =
  | 'ONBOARDING_ANALYTICS_FACT_INVALID'
  | 'ONBOARDING_ANALYTICS_QUEUE_FAILED';

export interface OnboardingAnalyticsRecordError {
  readonly kind: 'onboarding_analytics_record_error';
  readonly code: OnboardingAnalyticsRecordErrorCode;
}

export interface OnboardingAnalyticsRecorderPort {
  recordStarted(
    sessionId: string,
    startedAt: number,
  ): Promise<
    ApplicationResult<OnboardingAnalyticsRecordOutcome, OnboardingAnalyticsRecordError>
  >;
  recordCompleted(
    completedAt: number,
  ): Promise<
    ApplicationResult<OnboardingAnalyticsRecordOutcome, OnboardingAnalyticsRecordError>
  >;
}

export interface OnboardingAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: OnboardingAnalyticsRecordErrorCode,
): ApplicationResult<never, OnboardingAnalyticsRecordError> => ({
  ok: false,
  error: { kind: 'onboarding_analytics_record_error', code },
});

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 &&
  Number.isSafeInteger(value + ANALYTICS_EVENT_TTL_MS);

export class OnboardingAnalyticsRecorder implements OnboardingAnalyticsRecorderPort {
  constructor(private readonly dependencies: OnboardingAnalyticsRecorderDependencies) {}

  recordStarted(sessionId: string, startedAt: number) {
    if (sessionId.trim().length === 0 || !isSafeTimestamp(startedAt)) {
      return Promise.resolve(failure('ONBOARDING_ANALYTICS_FACT_INVALID'));
    }
    return this.record({
      eventId: `onboarding_started:${sessionId}`,
      eventName: 'onboarding_started',
      occurredAt: startedAt,
    });
  }

  recordCompleted(completedAt: number) {
    if (!isSafeTimestamp(completedAt)) {
      return Promise.resolve(failure('ONBOARDING_ANALYTICS_FACT_INVALID'));
    }
    return this.record({
      eventId: `onboarding_completed:1:${completedAt}`,
      eventName: 'onboarding_completed',
      occurredAt: completedAt,
    });
  }

  private async record(
    milestone: Pick<AnalyticsEventRecord, 'eventId' | 'eventName' | 'occurredAt'>,
  ): Promise<
    ApplicationResult<OnboardingAnalyticsRecordOutcome, OnboardingAnalyticsRecordError>
  > {
    let captureEnabled: boolean;
    try {
      captureEnabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('ONBOARDING_ANALYTICS_QUEUE_FAILED');
    }
    if (!captureEnabled) {
      return { ok: true, value: { outcome: 'skipped_disabled' } };
    }

    const event: AnalyticsEventRecord = {
      ...milestone,
      properties: Object.freeze({}),
      expiresAt: milestone.occurredAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: milestone.occurredAt,
    };
    try {
      const queued = await this.dependencies.queue.enqueueBounded(
        event,
        milestone.occurredAt,
      );
      if (!queued.ok) return failure('ONBOARDING_ANALYTICS_QUEUE_FAILED');
      return {
        ok: true,
        value: { outcome: queued.value, eventId: milestone.eventId },
      };
    } catch {
      return failure('ONBOARDING_ANALYTICS_QUEUE_FAILED');
    }
  }
}
