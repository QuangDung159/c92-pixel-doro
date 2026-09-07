import { describe, expect, it, vi } from 'vitest';

import { StandardFocusOutcomeController } from './standard-focus-outcome.controller';

describe('StandardFocusOutcomeController', () => {
  it('retains completed exact identity with detached callbacks and ignores calls after dispose', () => {
    const controller = new StandardFocusOutcomeController();
    const { publishFreshCompletion, consume } = controller;
    const result = { status: 'completed', sessionId: 'focus-1', receiptId: 'receipt-1', mode: 'strict',
      workTag: 'study', durationMinutes: 15, startedAt: 1_000, endsAt: 901_000, resolvedAt: 901_000,
      rewardClaimedAt: 901_000, xpEarned: 15, coinsEarned: 3, totalXp: 20, coinBalance: 4 } as const;
    publishFreshCompletion(result);
    consume('other');
    expect(controller.getSnapshot()).toMatchObject({ status: 'completed', sessionId: 'focus-1', receiptId: 'receipt-1' });
    consume('focus-1');
    controller.dispose();
    publishFreshCompletion(result);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
  it('retains an exact fresh failed handoff until the matching Result consumes it', () => {
    const controller = new StandardFocusOutcomeController();
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.publishFreshFailure('strict-1', 21_000);
    expect(controller.getSnapshot()).toEqual({
      status: 'failed', sessionId: 'strict-1', resolvedAt: 21_000,
    });
    controller.consume('other');
    expect(controller.getSnapshot().status).toBe('failed');
    controller.consume('strict-1');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps public actions safe when presentation passes them as callbacks', () => {
    const controller = new StandardFocusOutcomeController();
    const publishFreshFailure = controller.publishFreshFailure;
    const consume = controller.consume;

    publishFreshFailure('strict-1', 21_000);
    consume('strict-1');

    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
});
