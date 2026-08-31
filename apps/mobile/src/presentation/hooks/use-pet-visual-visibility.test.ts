import { describe, expect, it } from 'vitest';

import { derivePetVisualVisibility } from './use-pet-visual-visibility';

describe('derivePetVisualVisibility', () => {
  it.each([
    ['active', true, true, true],
    ['background', true, true, false],
    ['active', false, true, false],
    ['active', true, false, false],
  ] as const)(
    'maps app=%s focused=%s mounted=%s to %s',
    (appState, screenFocused, mounted, expected) => {
      expect(derivePetVisualVisibility({
        appState,
        screenFocused,
        mounted,
      })).toBe(expected);
    },
  );
});
