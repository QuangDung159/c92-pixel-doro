import {
  decidePetTerminalFeedback,
  decidePetTerminalFreshness,
  type FreshCommittedTerminalTransition,
  type PetTerminalCurrentFeedback,
  type PetTerminalState,
} from '@pixeldoro/domain';

import type { ClockPort } from '../ports/clock.port';

export interface PetFeedbackScheduler {
  schedule(callback: () => void, delayMs: number): () => void;
}

export interface PetTerminalFeedbackRequestContext {
  readonly currentResultSessionId: string;
  readonly activeSessionId: string | null;
}

export type PetTerminalFeedbackProjection =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'active';
      feedbackId: string;
      sessionId: string;
      terminalStatus: 'completed' | 'failed';
      committedAtMs: number;
      state: PetTerminalState;
      startedAtMs: number;
      endsAtMs: number;
      visualMode: 'one-shot' | 'still';
    }>
  | Readonly<{
      status: 'recovery';
      reason:
        | 'invalid_terminal_transition'
        | 'feedback_runtime_unavailable'
        | 'conflicting_committed_truth';
    }>;

export type PetTerminalFeedbackRequestResult =
  | Readonly<{ accepted: true; feedbackId: string }>
  | Readonly<{
      accepted: false;
      reason:
        | 'duplicate_terminal_transition'
        | 'stale_terminal_transition'
        | 'terminal_result_has_no_pet_feedback'
        | 'invalid_terminal_transition'
        | 'feedback_runtime_unavailable'
        | 'conflicting_committed_truth';
    }>;

export interface PetTerminalFeedbackControllerDependencies {
  readonly clock: ClockPort;
  readonly scheduler: PetFeedbackScheduler;
}

const idle = (): PetTerminalFeedbackProjection => Object.freeze({ status: 'idle' });

export class PetTerminalFeedbackController {
  private projection: PetTerminalFeedbackProjection = idle();
  private readonly listeners = new Set<() => void>();
  private readonly seenFeedbackIds = new Set<string>();
  private readonly terminalStatusBySessionId = new Map<
    string,
    FreshCommittedTerminalTransition['terminalStatus']
  >();
  private latestAcceptedTerminal: PetTerminalCurrentFeedback | undefined;
  private cancelScheduledEnd: (() => void) | undefined;
  private disposed = false;

  constructor(
    private readonly dependencies: PetTerminalFeedbackControllerDependencies,
  ) {}

  getSnapshot = (): PetTerminalFeedbackProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  requestFreshTransition(
    transition: FreshCommittedTerminalTransition,
    context: PetTerminalFeedbackRequestContext,
  ): PetTerminalFeedbackRequestResult {
    if (this.disposed) {
      return Object.freeze({ accepted: false, reason: 'feedback_runtime_unavailable' });
    }

    const feedbackDecision = decidePetTerminalFeedback(transition);
    if (feedbackDecision.kind === 'invalid') {
      this.enterRecovery('invalid_terminal_transition');
      return Object.freeze({ accepted: false, reason: 'invalid_terminal_transition' });
    }

    const dedupeKey = `${transition.sessionId}:${transition.terminalStatus}`;
    const freshness = decidePetTerminalFreshness({
      sessionId: transition.sessionId,
      terminalStatus: transition.terminalStatus,
      committedAtMs: transition.committedAtMs,
      dedupeKey,
    }, {
      ...context,
      knownTerminalStatus: this.terminalStatusBySessionId.get(transition.sessionId),
      candidateSeen: this.seenFeedbackIds.has(dedupeKey),
      currentFeedback: this.latestAcceptedTerminal,
    });

    if (freshness.kind === 'recovery') {
      this.enterRecovery('conflicting_committed_truth');
      return Object.freeze({
        accepted: false,
        reason: 'conflicting_committed_truth',
      });
    }
    if (freshness.kind === 'drop') {
      return Object.freeze({
        accepted: false,
        reason: freshness.reason === 'duplicate'
          ? 'duplicate_terminal_transition'
          : 'stale_terminal_transition',
      });
    }

    if (feedbackDecision.kind === 'none') {
      this.terminalStatusBySessionId.set(
        transition.sessionId,
        transition.terminalStatus,
      );
      this.seenFeedbackIds.add(dedupeKey);
      this.latestAcceptedTerminal = Object.freeze({
        sessionId: transition.sessionId,
        terminalStatus: transition.terminalStatus,
        committedAtMs: transition.committedAtMs,
      });
      return Object.freeze({
        accepted: false,
        reason: 'terminal_result_has_no_pet_feedback',
      });
    }

    this.cancelScheduledEnd?.();
    this.cancelScheduledEnd = undefined;
    const startedAtMs = this.dependencies.clock.nowMs();
    const activeProjection = Object.freeze({
      status: 'active' as const,
      feedbackId: feedbackDecision.dedupeKey,
      sessionId: transition.sessionId,
      terminalStatus: transition.terminalStatus as 'completed' | 'failed',
      committedAtMs: transition.committedAtMs,
      state: feedbackDecision.state,
      startedAtMs,
      endsAtMs: startedAtMs + feedbackDecision.durationMs,
      visualMode: 'one-shot' as const,
    });
    try {
      this.cancelScheduledEnd = this.dependencies.scheduler.schedule(
        () => this.finish(feedbackDecision.dedupeKey),
        feedbackDecision.durationMs,
      );
    } catch {
      this.enterRecovery('feedback_runtime_unavailable');
      return Object.freeze({
        accepted: false,
        reason: 'feedback_runtime_unavailable',
      });
    }
    this.terminalStatusBySessionId.set(
      transition.sessionId,
      transition.terminalStatus,
    );
    this.seenFeedbackIds.add(dedupeKey);
    this.latestAcceptedTerminal = Object.freeze({
      sessionId: transition.sessionId,
      terminalStatus: transition.terminalStatus,
      committedAtMs: transition.committedAtMs,
    });
    this.publish(activeProjection);
    return Object.freeze({
      accepted: true,
      feedbackId: feedbackDecision.dedupeKey,
    });
  }

  preemptByCommittedActiveSession(activeSessionId: string): void {
    if (this.disposed || this.projection.status !== 'active') return;
    if (this.projection.sessionId === activeSessionId) {
      this.enterRecovery('conflicting_committed_truth');
      return;
    }
    this.discardActive();
  }

  discardActive(): void {
    if (this.disposed || this.projection.status !== 'active') return;
    this.cancelScheduledEnd?.();
    this.cancelScheduledEnd = undefined;
    this.publish(idle());
  }

  reportVisualComplete(feedbackId: string): void {
    this.holdStillUntilDeadline(feedbackId);
  }

  reportVisualFailure(feedbackId: string): void {
    this.holdStillUntilDeadline(feedbackId);
  }

  dismissRecovery(): void {
    if (!this.disposed && this.projection.status === 'recovery') {
      this.cancelScheduledEnd?.();
      this.cancelScheduledEnd = undefined;
      this.publish(idle());
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelScheduledEnd?.();
    this.cancelScheduledEnd = undefined;
    this.listeners.clear();
  }

  private enterRecovery(
    reason: Extract<PetTerminalFeedbackProjection, { status: 'recovery' }>['reason'],
  ): void {
    this.cancelScheduledEnd?.();
    this.cancelScheduledEnd = undefined;
    this.publish(Object.freeze({ status: 'recovery', reason }));
  }

  private holdStillUntilDeadline(feedbackId: string): void {
    if (
      this.projection.status !== 'active' ||
      this.projection.feedbackId !== feedbackId ||
      this.projection.visualMode === 'still'
    ) return;
    this.publish(Object.freeze({ ...this.projection, visualMode: 'still' }));
  }

  private finish(feedbackId: string): void {
    if (
      this.disposed ||
      this.projection.status !== 'active' ||
      this.projection.feedbackId !== feedbackId
    ) return;
    this.cancelScheduledEnd = undefined;
    this.publish(idle());
  }

  private publish(projection: PetTerminalFeedbackProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // A visual subscriber cannot change feedback lifecycle or durable truth.
      }
    }
  }
}
