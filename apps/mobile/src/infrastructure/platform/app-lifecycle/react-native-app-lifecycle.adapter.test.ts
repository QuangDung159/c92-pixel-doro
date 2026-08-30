import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReactNativeAppLifecycleAdapter } from './react-native-app-lifecycle.adapter';

const remove = vi.fn();
let currentState = 'active';
let changeListener: ((state: string) => void) | undefined;

vi.mock('react-native', () => ({
  AppState: {
    get currentState() {
      return currentState;
    },
    addEventListener: vi.fn(
      (_event: string, listener: (state: string) => void) => {
        changeListener = listener;
        return { remove };
      },
    ),
  },
}));

describe('React Native app lifecycle adapter', () => {
  beforeEach(() => {
    currentState = 'active';
    changeListener = undefined;
    remove.mockClear();
  });

  it('maps current state and one application-scoped subscription', () => {
    const adapter = new ReactNativeAppLifecycleAdapter();
    const listener = vi.fn();

    expect(adapter.getCurrentState()).toBe('active');
    currentState = 'inactive';
    expect(adapter.getCurrentState()).toBe('background');

    const unsubscribe = adapter.subscribe(listener);
    changeListener?.('active');
    changeListener?.('background');
    changeListener?.('inactive');
    expect(listener.mock.calls).toEqual([
      ['active'],
      ['background'],
      ['background'],
    ]);

    unsubscribe();
    expect(remove).toHaveBeenCalledOnce();
  });
});
