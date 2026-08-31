import type { FreshCommittedTerminalTransition } from '@pixeldoro/domain';
import { describe, expect, it, vi } from 'vitest';

import {
  PetTerminalFeedbackController,
  type PetFeedbackScheduler,
} from './pet-terminal-feedback.controller';

class FakeRuntime implements PetFeedbackScheduler {
  nowMs = 1_000;
  private jobs: { at: number; callback: () => void; cancelled: boolean }[] = [];

  readonly clock = { nowMs: () => this.nowMs };

  schedule(callback: () => void, delayMs: number): () => void {
    const job = { at: this.nowMs + delayMs, callback, cancelled: false };
    this.jobs.push(job);
    return () => {
      job.cancelled = true;
    };
  }

  advanceBy(durationMs: number): void {
    this.nowMs += durationMs;
    for (const job of this.jobs) {
      if (!job.cancelled && job.at <= this.nowMs) {
        job.cancelled = true;
        job.callback();
      }
    }
  }
}

const completedFocus = (
  overrides: Partial<FreshCommittedTerminalTransition> = {},
): FreshCommittedTerminalTransition => ({
  sessionId: 'focus-1',
  committedAtMs: 100,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  terminalStatus: 'completed',
  rewardCommitted: true,
  ...overrides,
});

const contextFor = (
  transition: FreshCommittedTerminalTransition,
  activeSessionId: string | null = null,
) => ({
  currentResultSessionId: transition.sessionId,
  activeSessionId,
});

describe('PetTerminalFeedbackController', () => {
  it('holds Celebrate for exactly 2 seconds without blocking callers', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });

    const transition = completedFocus();
    expect(controller.requestFreshTransition(transition, contextFor(transition))).toEqual({
      accepted: true,
      feedbackId: 'focus-1:completed',
    });
    expect(controller.getSnapshot()).toMatchObject({
      status: 'active',
      state: 'celebrating',
      endsAtMs: 3_000,
    });
    runtime.advanceBy(1_999);
    expect(controller.getSnapshot().status).toBe('active');
    runtime.advanceBy(1);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('holds Bugged for exactly 1.5 seconds', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus({
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    });
    controller.requestFreshTransition(transition, contextFor(transition));

    runtime.advanceBy(1_499);
    expect(controller.getSnapshot()).toMatchObject({ status: 'active', state: 'bugged' });
    runtime.advanceBy(1);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('dedupes the same terminal key for the whole application runtime', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus();
    controller.requestFreshTransition(transition, contextFor(transition));
    runtime.advanceBy(2_000);

    expect(controller.requestFreshTransition(transition, contextFor(transition))).toEqual({
      accepted: false,
      reason: 'duplicate_terminal_transition',
    });
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('keeps the final still pose until the approved deadline after visual completion or failure', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus();
    controller.requestFreshTransition(transition, contextFor(transition));
    controller.reportVisualComplete('focus-1:completed');

    expect(controller.getSnapshot()).toMatchObject({
      status: 'active',
      visualMode: 'still',
    });
    runtime.advanceBy(2_000);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('keeps failed Bugged playback as a preemptible still for at most 1.500 ms', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus({
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    });
    controller.requestFreshTransition(transition, contextFor(transition));
    controller.reportVisualFailure('focus-1:failed');

    expect(controller.getSnapshot()).toMatchObject({
      status: 'active',
      state: 'bugged',
      visualMode: 'still',
    });
    runtime.advanceBy(1_499);
    expect(controller.getSnapshot().status).toBe('active');
    controller.preemptByCommittedActiveSession('focus-2');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('publishes safe recovery for an impossible transition without scheduling feedback', () => {
    const runtime = new FakeRuntime();
    const listener = vi.fn();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    controller.subscribe(listener);

    const transition = completedFocus({
      rewardCommitted: false,
    });
    expect(controller.requestFreshTransition(transition, contextFor(transition))).toEqual({
      accepted: false,
      reason: 'invalid_terminal_transition',
    });
    expect(controller.getSnapshot()).toEqual({
      status: 'recovery',
      reason: 'invalid_terminal_transition',
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('cancels active feedback before entering and dismissing safe recovery', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus();
    controller.requestFreshTransition(transition, contextFor(transition));

    const invalidTransition = completedFocus({
      sessionId: 'invalid-focus',
      committedAtMs: 101,
      rewardCommitted: false,
    });
    controller.requestFreshTransition(
      invalidTransition,
      contextFor(invalidTransition),
    );
    expect(controller.getSnapshot()).toEqual({
      status: 'recovery',
      reason: 'invalid_terminal_transition',
    });

    controller.dismissRecovery();
    runtime.advanceBy(2_000);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('replaces only with a newer current Result event and drops stale context', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const first = completedFocus();
    controller.requestFreshTransition(first, contextFor(first));
    const newer = completedFocus({
      sessionId: 'focus-2',
      committedAtMs: 200,
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    });

    expect(controller.requestFreshTransition(newer, contextFor(newer))).toEqual({
      accepted: true,
      feedbackId: 'focus-2:failed',
    });
    expect(controller.getSnapshot()).toMatchObject({
      status: 'active',
      state: 'bugged',
      sessionId: 'focus-2',
    });
    runtime.advanceBy(1_500);
    const stale = completedFocus({
      sessionId: 'focus-3',
      committedAtMs: 150,
    });
    expect(controller.requestFreshTransition(stale, contextFor(stale))).toEqual({
      accepted: false,
      reason: 'stale_terminal_transition',
    });
  });

  it('drops terminal input behind active committed truth without a visible flash', () => {
    const runtime = new FakeRuntime();
    const listener = vi.fn();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    controller.subscribe(listener);
    const transition = completedFocus();

    expect(controller.requestFreshTransition(
      transition,
      contextFor(transition, 'new-focus'),
    )).toEqual({ accepted: false, reason: 'stale_terminal_transition' });
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('preempts active feedback permanently when a new committed session appears', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus();
    controller.requestFreshTransition(transition, contextFor(transition));

    controller.preemptByCommittedActiveSession('break-2');
    runtime.advanceBy(2_000);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    expect(controller.requestFreshTransition(transition, contextFor(transition))).toEqual({
      accepted: false,
      reason: 'duplicate_terminal_transition',
    });
  });

  it('enters recovery for conflicting terminal statuses of the same session', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const completed = completedFocus();
    controller.requestFreshTransition(completed, contextFor(completed));
    const failed = completedFocus({
      committedAtMs: 101,
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    });

    expect(controller.requestFreshTransition(failed, contextFor(failed))).toEqual({
      accepted: false,
      reason: 'conflicting_committed_truth',
    });
    expect(controller.getSnapshot()).toEqual({
      status: 'recovery',
      reason: 'conflicting_committed_truth',
    });
  });

  it('discards a backgrounded effect while retaining runtime dedupe', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });
    const transition = completedFocus();
    controller.requestFreshTransition(transition, contextFor(transition));
    controller.discardActive();

    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    expect(controller.requestFreshTransition(transition, contextFor(transition))).toEqual({
      accepted: false,
      reason: 'duplicate_terminal_transition',
    });
  });
});
