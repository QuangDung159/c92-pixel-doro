import { describe, expect, it, vi } from 'vitest';

import { petAnimationManifest } from './pet-animation-manifest';
import { PetPlaybackController } from './pet-playback.controller';
import type {
  PetPlaybackDriver,
  PetPlaybackDriverCallbacks,
  PetPlaybackHandle,
  PetPlaybackReconcileInput,
} from './pet-playback.driver';

class FakeDriver implements PetPlaybackDriver {
  readonly starts: PetPlaybackDriverCallbacks[] = [];
  readonly handles: { cancel: ReturnType<typeof vi.fn> }[] = [];
  throwOnStart = false;

  start(
    _entry: PetPlaybackReconcileInput['entry'],
    callbacks: PetPlaybackDriverCallbacks,
  ): PetPlaybackHandle {
    if (this.throwOnStart) throw new Error('playback unavailable');
    this.starts.push(callbacks);
    const handle = { cancel: vi.fn() };
    this.handles.push(handle);
    return handle;
  }
}

const input = (
  overrides: Partial<PetPlaybackReconcileInput> = {},
): PetPlaybackReconcileInput => ({
  playbackId: 'base:working:focus-1',
  entry: petAnimationManifest.working,
  isVisible: true,
  reduceMotion: false,
  visualMode: 'loop',
  ...overrides,
});

const callbacks = () => ({ onComplete: vi.fn(), onFailure: vi.fn() });

describe('PetPlaybackController', () => {
  it('does not restart equivalent loop projections', () => {
    const driver = new FakeDriver();
    const controller = new PetPlaybackController(driver);

    controller.reconcile(input(), callbacks());
    controller.reconcile(input(), callbacks());

    expect(driver.starts).toHaveLength(1);
    expect(driver.handles[0]?.cancel).not.toHaveBeenCalled();
  });

  it('cancels prior playback before a state change', () => {
    const driver = new FakeDriver();
    const controller = new PetPlaybackController(driver);
    controller.reconcile(input(), callbacks());

    controller.reconcile(input({
      playbackId: 'base:breaking:break-1',
      entry: petAnimationManifest.breaking,
    }), callbacks());

    expect(driver.handles[0]?.cancel).toHaveBeenCalledOnce();
    expect(driver.starts).toHaveLength(2);
  });

  it.each([
    { isVisible: false },
    { reduceMotion: true },
    { visualMode: 'still' as const },
  ])('uses static rendering and cancels motion for %j', (override) => {
    const driver = new FakeDriver();
    const controller = new PetPlaybackController(driver);
    controller.reconcile(input(), callbacks());

    controller.reconcile(input(override), callbacks());

    expect(driver.handles[0]?.cancel).toHaveBeenCalledOnce();
    expect(driver.starts).toHaveLength(1);
  });

  it('ignores completion and failure callbacks after cancellation', () => {
    const driver = new FakeDriver();
    const events = callbacks();
    const controller = new PetPlaybackController(driver);
    controller.reconcile(input(), events);
    controller.reconcile(input({ isVisible: false }), events);

    driver.starts[0]?.onComplete();
    driver.starts[0]?.onFailure();

    expect(events.onComplete).not.toHaveBeenCalled();
    expect(events.onFailure).not.toHaveBeenCalled();
  });

  it('reports one-shot completion once without restarting an equivalent render', () => {
    const driver = new FakeDriver();
    const events = callbacks();
    const controller = new PetPlaybackController(driver);
    const oneShot = input({
      playbackId: 'focus-1:completed',
      entry: petAnimationManifest.celebrating,
      visualMode: 'one-shot',
    });
    controller.reconcile(oneShot, events);

    driver.starts[0]?.onComplete();
    driver.starts[0]?.onComplete();
    controller.reconcile(oneShot, events);

    expect(events.onComplete).toHaveBeenCalledOnce();
    expect(driver.starts).toHaveLength(1);
  });

  it('contains driver failure and remains idempotently disposable', () => {
    const driver = new FakeDriver();
    driver.throwOnStart = true;
    const events = callbacks();
    const controller = new PetPlaybackController(driver);

    expect(() => controller.reconcile(input(), events)).not.toThrow();
    expect(events.onFailure).toHaveBeenCalledOnce();
    controller.dispose();
    controller.dispose();
  });
});
