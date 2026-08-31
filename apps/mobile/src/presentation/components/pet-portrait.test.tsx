import { describe, expect, it, vi } from 'vitest';

import { PetPortrait } from './pet-portrait';

vi.mock('react-native', () => ({
  Image: 'Image',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));

describe('PetPortrait production stills', () => {
  it.each(['idle', 'working', 'breaking', 'celebrating', 'bugged'] as const)(
    'renders the approved Cat %s sheet at its fallback frame',
    (state) => {
      const tree = PetPortrait({ state });
      expect(tree.props.testID).toBe(`pet-sprite-${state}-still`);
      expect(tree.props.children.type).toBe('Image');
      expect(tree.props.children.props.source).toBeDefined();
    },
  );
});
