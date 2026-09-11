import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProgressionSummary } from './progression-summary';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

const flatten = (node: ReactNode): ReactNode[] => Children.toArray(node).flatMap((value) =>
  isValidElement<{ readonly children?: ReactNode }>(value)
    ? [value, ...flatten(value.props.children)]
    : [value]);

describe('ProgressionSummary', () => {
  it('renders a grouped committed full progression without deriving values', () => {
    const tree = ProgressionSummary({
      variant: 'full',
      progression: {
        level: 2,
        totalXp: 50,
        coinBalance: 10,
        levelProgressPercent: 0,
        xpToNextLevel: 75,
      },
    });
    const nodes = flatten(tree).filter(isValidElement<{
      readonly accessibilityRole?: string;
      readonly accessibilityValue?: { readonly now?: number };
    }>);
    expect(JSON.stringify(tree)).toContain('Còn ');
    expect(JSON.stringify(tree)).toContain('75');
    expect(nodes.some((node) => node.props.accessibilityRole === 'progressbar' &&
      node.props.accessibilityValue?.now === 0)).toBe(true);
  });

  it('preserves the existing result variant contract', () => {
    const tree = ProgressionSummary({ totalXp: 25, coinBalance: 5 });
    expect(JSON.stringify(tree)).toContain('Tổng hiện tại: 25 XP và 5 Coin');
    expect(JSON.stringify(tree)).not.toContain('progressbar');
  });
});
