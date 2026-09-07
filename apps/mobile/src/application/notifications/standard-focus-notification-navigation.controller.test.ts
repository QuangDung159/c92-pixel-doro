import { describe, expect, it, vi } from 'vitest';

import { StandardFocusNotificationNavigationController } from './standard-focus-notification-navigation.controller';

describe('StandardFocusNotificationNavigationController', () => {
  it('publishes and consumes only the exact navigation request', () => {
    const controller = new StandardFocusNotificationNavigationController();
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.publish('result', 'focus-1');
    const pending = controller.getSnapshot();
    expect(pending).toMatchObject({
      status: 'pending', destination: 'result', sessionId: 'focus-1', requestId: 1,
    });
    controller.consume(2);
    expect(controller.getSnapshot()).toBe(pending);
    controller.consume(1);
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('ignores invalid identities and all work after dispose', () => {
    const controller = new StandardFocusNotificationNavigationController();
    controller.publish('running', '   ');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    controller.dispose();
    controller.publish('running', 'focus-1');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
});

