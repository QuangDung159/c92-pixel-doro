import {
  decidePetTerminalFeedback,
  type FreshCommittedTerminalTransition,
  type PetTerminalState,
} from '@pixeldoro/domain';

import type { ClockPort } from '../ports/clock.port';

export interface PetFeedbackScheduler {
  schedule(callback: () => void, delayMs: number): () => void;
}

export type PetTerminalFeedbackProjection =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'active';
      feedbackId: string;
      state: PetTerminalState;
      startedAtMs: number;
      endsAtMs: number;
      visualMode: 'one-shot' | 'still';
    }>
  | Readonly<{
      status: 'recovery';
      reason: 'invalid_terminal_transition' | 'feedback_runtime_unavailable';
    }>;

export type PetTerminalFeedbackRequestResult =
  | Readonly<{ accepted: true; feedbackId: string }>
  | Readonly<{
      accepted: false;
      reason:
        | 'duplicate_terminal_transition'
        | 'feedback_in_progress'
        | 'terminal_result_has_no_pet_feedback'
        | 'invalid_terminal_transition'
        | 'feedback_runtime_unavailable';
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
  ): PetTerminalFeedbackRequestResult {
    if (this.disposed) {
      return Object.freeze({ accepted: false, reason: 'feedback_runtime_unavailable' });
    }

    const decision = decidePetTerminalFeedback(transition);
    if (decision.kind === 'invalid') {
      this.cancelScheduledEnd?.();
      this.cancelScheduledEnd = undefined;
      this.publish(Object.freeze({
        status: 'recovery',
        reason: 'invalid_terminal_transition',
      }));
      return Object.freeze({ accepted: false, reason: 'invalid_terminal_transition' });
    }
    if (decision.kind === 'none') {
      return Object.freeze({ accepted: false, reason: decision.reason });
    }
    if (this.seenFeedbackIds.has(decision.dedupeKey)) {
      return Object.freeze({
        accepted: false,
        reason: 'duplicate_terminal_transition',
      });
    }
    if (this.projection.status === 'active') {
      return Object.freeze({ accepted: false, reason: 'feedback_in_progress' });
    }

    const startedAtMs = this.dependencies.clock.nowMs();
    const activeProjection = Object.freeze({
      status: 'active' as const,
      feedbackId: decision.dedupeKey,
      state: decision.state,
      startedAtMs,
      endsAtMs: startedAtMs + decision.durationMs,
      visualMode: 'one-shot' as const,
    });
    try {
      this.cancelScheduledEnd = this.dependencies.scheduler.schedule(
        () => this.finish(decision.dedupeKey),
        decision.durationMs,
      );
    } catch {
      this.publish(Object.freeze({
        status: 'recovery',
        reason: 'feedback_runtime_unavailable',
      }));
      return Object.freeze({
        accepted: false,
        reason: 'feedback_runtime_unavailable',
      });
    }
    this.seenFeedbackIds.add(decision.dedupeKey);
    this.publish(activeProjection);
    return Object.freeze({ accepted: true, feedbackId: decision.dedupeKey });
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
