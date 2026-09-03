import { describe, expect, it, vi } from 'vitest';

import { StandardFocusOutcomeController } from './standard-focus-outcome.controller';

describe('StandardFocusOutcomeController', () => {
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
});
