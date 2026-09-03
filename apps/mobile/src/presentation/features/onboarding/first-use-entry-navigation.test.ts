import { describe, expect, it, vi } from 'vitest';

import {
  pathForFirstUseDestination,
  synchronizeFirstUseEntryNavigation,
} from './first-use-entry-navigation';

describe('first-use entry navigation', () => {
  it.each([
    ['onboarding_intro', '/(onboarding)'],
    ['trial_running', '/focus/session'],
    ['trial_result', '/focus/result'],
    ['standard_focus_running', '/focus/session'],
    ['home', '/(tabs)'],
  ] as const)('maps %s to %s', (destination, path) => {
    expect(pathForFirstUseDestination(destination)).toBe(path);
  });

  it('replaces only for a new ready destination', () => {
    const replace = vi.fn();
    const loading = synchronizeFirstUseEntryNavigation(
      { status: 'loading' },
      null,
      replace,
    );
    expect(loading).toBeNull();
    expect(replace).not.toHaveBeenCalled();

    const first = synchronizeFirstUseEntryNavigation(
      { status: 'ready', destination: 'home' },
      loading,
      replace,
    );
    expect(first).toBe('home');
    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith('/(tabs)');

    const duplicate = synchronizeFirstUseEntryNavigation(
      { status: 'ready', destination: 'home' },
      first,
      replace,
    );
    expect(duplicate).toBe('home');
    expect(replace).toHaveBeenCalledOnce();
  });
});
