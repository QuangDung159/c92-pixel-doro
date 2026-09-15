import { describe, expect, it, vi } from 'vitest';

import { PixelTabIcon, type PixelTabIconName } from './pixel-tab-icon';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));

const iconNames: readonly PixelTabIconName[] = ['pet-room', 'history', 'shop', 'settings'];

describe('PixelTabIcon', () => {
  it.each(iconNames)('renders the %s icon as a decorative tinted pixel grid', (name) => {
    const tree = PixelTabIcon({ color: '#123456', name });
    const pixels = (tree.props.children as readonly unknown[]).filter(Boolean) as readonly {
      readonly props: { readonly style: readonly unknown[] };
    }[];

    expect(tree.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
      testID: `tab-icon-${name}`,
    });
    expect(pixels.length).toBeGreaterThan(20);
    expect(pixels[0]?.props.style).toContainEqual({
      backgroundColor: '#123456',
      left: expect.any(Number),
      top: expect.any(Number),
    });
  });

  it('uses a distinct pixel silhouette for every destination', () => {
    const silhouettes = iconNames.map((name) =>
      JSON.stringify(PixelTabIcon({ color: '#000000', name }).props.children),
    );

    expect(new Set(silhouettes).size).toBe(iconNames.length);
  });
});
