import type { BreakSessionProjection, RunningSessionRecord } from '@pixeldoro/application';

import {
  ANALYTICS_EVENT_TTL_MS,
  type AnalyticsEventRecord,
  type AnalyticsQueue,
} from '../persistence';

export interface BreakAnalyticsRecorderPort {
  recordStarted(session: RunningSessionRecord): Promise<void>;
  recordCompleted(session: Extract<BreakSessionProjection, { status: 'completed' }>): Promise<void>;
}

export interface BreakAnalyticsRecorderDependencies {
  readonly isCaptureEnabled: () => boolean;
  readonly queue: Pick<AnalyticsQueue, 'enqueueBounded'>;
}

const validTime = (value: number): boolean => Number.isSafeInteger(value) && value >= 0 &&
  Number.isSafeInteger(value + ANALYTICS_EVENT_TTL_MS);

const breakFacts = (session: RunningSessionRecord | BreakSessionProjection) => {
  const sessionId = 'id' in session ? session.id : session.sessionId;
  const sessionType = 'sessionType' in session ? session.sessionType
    : session.kind === 'long' ? 'long_break' : 'short_break';
  const durationMinutes = 'configuredDurationMinutes' in session
    ? session.configuredDurationMinutes : session.durationMinutes;
  return { sessionId, sessionType, durationMinutes } as const;
};

export class BreakAnalyticsRecorder implements BreakAnalyticsRecorderPort {
  constructor(private readonly dependencies: BreakAnalyticsRecorderDependencies) {}

  async recordStarted(session: RunningSessionRecord): Promise<void> {
    const facts = breakFacts(session);
    if (session.status !== 'running' || session.focusVariant !== null || session.mode !== null ||
      session.workTag !== null || !validTime(session.startedAt) || !this.validFacts(facts)) return;
    await this.record({ eventId: `break_started:${facts.sessionId}`, eventName: 'break_started',
      occurredAt: session.startedAt, facts });
  }

  async recordCompleted(
    session: Extract<BreakSessionProjection, { status: 'completed' }>,
  ): Promise<void> {
    const facts = breakFacts(session);
    if (!validTime(session.resolvedAt) || session.resolvedAt < session.endsAt ||
      !this.validFacts(facts)) return;
    await this.record({ eventId: `break_completed:${facts.sessionId}`, eventName: 'break_completed',
      occurredAt: session.resolvedAt, facts, terminalStatus: 'completed' });
  }

  private validFacts(facts: ReturnType<typeof breakFacts>): boolean {
    return facts.sessionId.trim().length > 0 &&
      (facts.sessionType === 'short_break' && facts.durationMinutes === 5 ||
        facts.sessionType === 'long_break' && facts.durationMinutes === 15);
  }

  private async record(input: {
    readonly eventId: string;
    readonly eventName: 'break_started' | 'break_completed';
    readonly occurredAt: number;
    readonly facts: ReturnType<typeof breakFacts>;
    readonly terminalStatus?: 'completed';
  }): Promise<void> {
    let enabled = false;
    try { enabled = this.dependencies.isCaptureEnabled(); } catch { return; }
    if (!enabled) return;
    const event: AnalyticsEventRecord = Object.freeze({
      eventId: input.eventId,
      eventName: input.eventName,
      properties: Object.freeze({
        breakType: input.facts.sessionType,
        durationMinutes: input.facts.durationMinutes,
        ...(input.terminalStatus === undefined ? {} : { terminalStatus: input.terminalStatus }),
      }),
      occurredAt: input.occurredAt,
      expiresAt: input.occurredAt + ANALYTICS_EVENT_TTL_MS,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: input.occurredAt,
    });
    try { await this.dependencies.queue.enqueueBounded(event, input.occurredAt); } catch {
      // Analytics is best effort and cannot affect Break truth.
    }
  }
}
