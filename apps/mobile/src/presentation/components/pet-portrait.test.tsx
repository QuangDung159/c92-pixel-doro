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
      expect(tree.props.children.type).toBe('View');
      expect(tree.props.children.props.children.type).toBe('Image');
      expect(tree.props.children.props.children.props.source).toBeDefined();
    },
  );

  it('keeps the breaking pose in place while masking its top-edge artifact', () => {
    const tree = PetPortrait({ state: 'breaking' });
    const clip = tree.props.children;
    const image = clip.props.children;
    expect(clip.props.style).toMatchObject({ overflow: 'hidden', top: expect.any(Number) });
    expect(image.props.style[1].top).toBe(-clip.props.style.top);
  });
});
