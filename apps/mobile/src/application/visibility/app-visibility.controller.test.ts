import { describe, expect, it, vi } from 'vitest';

import { AppVisibilityController } from './app-visibility.controller';

describe('AppVisibilityController', () => {
  it('publishes lifecycle changes once and ignores equivalent values', () => {
    const controller = new AppVisibilityController('active');
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.publish('active');
    controller.publish('background');
    controller.publish('background');

    expect(controller.getSnapshot()).toBe('background');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('stops publishing after idempotent disposal', () => {
    const controller = new AppVisibilityController('active');
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.dispose();
    controller.dispose();
    controller.publish('background');

    expect(controller.getSnapshot()).toBe('active');
    expect(listener).not.toHaveBeenCalled();
  });
});
