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
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  terminalStatus: 'completed',
  rewardCommitted: true,
  ...overrides,
});

describe('PetTerminalFeedbackController', () => {
  it('holds Celebrate for exactly 2 seconds without blocking callers', () => {
    const runtime = new FakeRuntime();
    const controller = new PetTerminalFeedbackController({
      clock: runtime.clock,
      scheduler: runtime,
    });

    expect(controller.requestFreshTransition(completedFocus())).toEqual({
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
    controller.requestFreshTransition(completedFocus({
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    }));

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
    controller.requestFreshTransition(completedFocus());
    runtime.advanceBy(2_000);

    expect(controller.requestFreshTransition(completedFocus())).toEqual({
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
    controller.requestFreshTransition(completedFocus());
    controller.reportVisualComplete('focus-1:completed');

    expect(controller.getSnapshot()).toMatchObject({
      status: 'active',
      visualMode: 'still',
    });
    runtime.advanceBy(2_000);
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

    expect(controller.requestFreshTransition(completedFocus({
      rewardCommitted: false,
    }))).toEqual({
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
    controller.requestFreshTransition(completedFocus());

    controller.requestFreshTransition(completedFocus({
      sessionId: 'invalid-focus',
      rewardCommitted: false,
    }));
    expect(controller.getSnapshot()).toEqual({
      status: 'recovery',
      reason: 'invalid_terminal_transition',
    });

    controller.dismissRecovery();
    runtime.advanceBy(2_000);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
});
