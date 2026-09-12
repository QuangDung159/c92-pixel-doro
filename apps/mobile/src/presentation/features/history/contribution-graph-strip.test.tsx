import { describe, expect, it, vi } from 'vitest';

import { ContributionGraphStrip } from './contribution-graph-strip';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

const days = ['zero', 'low', 'medium', 'high', 'peak', 'zero', 'low'].map(
  (intensity, index) => ({
    localDate: `2026-09-${String(index + 6).padStart(2, '0')}`,
    completedMinutes: index * 25,
    completedSessionCount: index,
    intensity: intensity as 'zero' | 'low' | 'medium' | 'high' | 'peak',
  }),
);

describe('ContributionGraphStrip', () => {
  it('renders seven chronological decorative cells with compact day labels', () => {
    const tree = ContributionGraphStrip({ days });
    expect(tree.props.accessibilityElementsHidden).toBe(true);
    expect(tree.props.importantForAccessibility).toBe('no-hide-descendants');
    const cells = tree.props.children as readonly { readonly key: string; readonly props: unknown }[];
    expect(cells).toHaveLength(7);
    expect(cells.map((cell) => cell.key)).toEqual(days.map((day) => day.localDate));
    expect(JSON.stringify(tree)).toContain('06');
    expect(JSON.stringify(tree)).toContain('12');
  });
});
