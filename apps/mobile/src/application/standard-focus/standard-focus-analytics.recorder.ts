import type {
  ApplicationResult,
  RunningSessionRecord,
  StandardFocusTerminalResult,
} from '@pixeldoro/application';
import {
  calculateStandardFocusReward,
  validateStandardFocusConfiguration,
} from '@pixeldoro/domain';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export type StandardFocusAnalyticsOutcome =
  | { readonly outcome: 'skipped_disabled' }
  | {
      readonly outcome: 'recorded';
      readonly eventIds: readonly string[];
    };

export interface StandardFocusAnalyticsError {
  readonly kind: 'standard_focus_analytics_error';
  readonly code: 'STANDARD_FOCUS_ANALYTICS_FACT_INVALID' | 'STANDARD_FOCUS_ANALYTICS_QUEUE_FAILED';
}

export interface StandardFocusAnalyticsRecorderPort {
  recordStarted(
    session: RunningSessionRecord,
  ): Promise<ApplicationResult<StandardFocusAnalyticsOutcome, StandardFocusAnalyticsError>>;
  recordTerminal(
    result: StandardFocusTerminalResult,
  ): Promise<ApplicationResult<StandardFocusAnalyticsOutcome, StandardFocusAnalyticsError>>;
}

export interface StandardFocusAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const failure = (
  code: StandardFocusAnalyticsError['code'],
): ApplicationResult<never, StandardFocusAnalyticsError> => ({
  ok: false,
  error: { kind: 'standard_focus_analytics_error', code },
});

const validTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) &&
  value >= 0 &&
  Number.isSafeInteger(value + ANALYTICS_EVENT_TTL_MS);

const validConfiguration = (record: {
  readonly durationMinutes: number;
  readonly mode: RunningSessionRecord['mode'];
  readonly workTag: RunningSessionRecord['workTag'];
}): record is {
  readonly durationMinutes: number;
  readonly mode: NonNullable<RunningSessionRecord['mode']>;
  readonly workTag: NonNullable<RunningSessionRecord['workTag']>;
} => record.mode !== null && record.workTag !== null &&
  validateStandardFocusConfiguration({
    durationMinutes: record.durationMinutes,
    mode: record.mode,
    workTag: record.workTag,
  }).ok;

export class StandardFocusAnalyticsRecorder
  implements StandardFocusAnalyticsRecorderPort
{
  constructor(private readonly dependencies: StandardFocusAnalyticsRecorderDependencies) {}

  recordStarted(session: RunningSessionRecord) {
    if (
      session.focusVariant !== 'standard' ||
      session.sessionType !== 'focus' ||
      session.status !== 'running' ||
      session.id.trim().length === 0 ||
      !validTimestamp(session.startedAt) ||
      !validConfiguration({
        durationMinutes: session.configuredDurationMinutes,
        mode: session.mode,
        workTag: session.workTag,
      })
    ) return Promise.resolve(failure('STANDARD_FOCUS_ANALYTICS_FACT_INVALID'));

    return this.record([this.event(
      `focus_session_started:${session.id}`,
      'focus_session_started',
      session.startedAt,
      {
        mode: session.mode,
        workTag: session.workTag,
        durationMinutes: session.configuredDurationMinutes,
      },
    )]);
  }

  recordTerminal(result: StandardFocusTerminalResult) {
    if (
      result.sessionId.trim().length === 0 ||
      !validTimestamp(result.resolvedAt) ||
      !validConfiguration(result)
    ) return Promise.resolve(failure('STANDARD_FOCUS_ANALYTICS_FACT_INVALID'));

    const expectedReward = calculateStandardFocusReward(result.durationMinutes);
    if (
      result.status === 'completed' &&
      (!expectedReward.ok ||
        result.xpEarned !== expectedReward.xpEarned ||
        result.coinsEarned !== expectedReward.coinsEarned ||
        result.receiptId.trim().length === 0 ||
        result.rewardClaimedAt !== result.resolvedAt)
    ) return Promise.resolve(failure('STANDARD_FOCUS_ANALYTICS_FACT_INVALID'));

    const eventName = result.status === 'completed'
      ? 'focus_session_completed'
      : result.status === 'failed'
        ? 'focus_session_failed'
        : 'focus_session_cancelled';
    const events = [this.event(
      `${eventName}:${result.sessionId}`,
      eventName,
      result.resolvedAt,
      {
        mode: result.mode,
        workTag: result.workTag,
        durationMinutes: result.durationMinutes,
        terminalStatus: result.status,
      },
    )];
    if (result.status === 'completed') {
      events.push(this.event(
        `reward_granted:${result.receiptId}`,
        'reward_granted',
        result.rewardClaimedAt,
        {
          durationMinutes: result.durationMinutes,
          xpEarned: result.xpEarned,
          coinsEarned: result.coinsEarned,
        },
      ));
    }
    return this.record(events);
  }

  private event(
    eventId: string,
    eventName: AnalyticsEventRecord['eventName'],
    occurredAt: number,
    properties: AnalyticsEventRecord['properties'],
  ): AnalyticsEventRecord {
    return Object.freeze({
      eventId,
      eventName,
      properties: Object.freeze(properties),
      occurredAt,
      expiresAt: occurredAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: occurredAt,
    });
  }

  private async record(
    events: readonly AnalyticsEventRecord[],
  ): Promise<ApplicationResult<StandardFocusAnalyticsOutcome, StandardFocusAnalyticsError>> {
    let enabled: boolean;
    try {
      enabled = this.dependencies.isCaptureEnabled();
    } catch {
      return failure('STANDARD_FOCUS_ANALYTICS_QUEUE_FAILED');
    }
    if (!enabled) return { ok: true, value: { outcome: 'skipped_disabled' } };

    try {
      let queueFailed = false;
      for (const event of events) {
        const queued = await this.dependencies.queue.enqueueBounded(
          event,
          event.occurredAt,
        );
        if (!queued.ok) queueFailed = true;
      }
      if (queueFailed) return failure('STANDARD_FOCUS_ANALYTICS_QUEUE_FAILED');
      return {
        ok: true,
        value: { outcome: 'recorded', eventIds: events.map(({ eventId }) => eventId) },
      };
    } catch {
      return failure('STANDARD_FOCUS_ANALYTICS_QUEUE_FAILED');
    }
  }
}
