import { describe, expect, it, vi } from 'vitest';

import { ReducedMotionStore, type ReducedMotionSource } from './reduced-motion.store';

const flush = async () => await Promise.resolve();

describe('ReducedMotionStore', () => {
  it('starts safely still, reads the initial value and publishes changes', async () => {
    let listener: ((enabled: boolean) => void) | undefined;
    const source: ReducedMotionSource = {
      read: async () => false,
      subscribe: (next) => {
        listener = next;
        return vi.fn();
      },
    };
    const store = new ReducedMotionStore(source);
    const changed = vi.fn();
    store.subscribe(changed);

    expect(store.getSnapshot()).toBe(true);
    await flush();
    expect(store.getSnapshot()).toBe(false);
    listener?.(true);
    expect(store.getSnapshot()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('does not let a late initial read overwrite a newer OS event and cleans up once', async () => {
    let resolveRead: ((enabled: boolean) => void) | undefined;
    let listener: ((enabled: boolean) => void) | undefined;
    const unsubscribe = vi.fn();
    const store = new ReducedMotionStore({
      read: () => new Promise((resolve) => {
        resolveRead = resolve;
      }),
      subscribe: (next) => {
        listener = next;
        return unsubscribe;
      },
    });

    listener?.(false);
    resolveRead?.(true);
    await flush();
    expect(store.getSnapshot()).toBe(false);
    store.dispose();
    store.dispose();
    listener?.(true);
    expect(store.getSnapshot()).toBe(false);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
