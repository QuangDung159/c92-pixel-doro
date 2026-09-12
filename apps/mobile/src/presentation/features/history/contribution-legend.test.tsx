import { describe, expect, it, vi } from 'vitest';

import { ContributionLegend } from './contribution-legend';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('ContributionLegend', () => {
  it('shows exact non-evaluative ranges in one accessible group', () => {
    const tree = ContributionLegend();
    expect(tree.props.accessible).toBe(true);
    expect(tree.props.accessibilityRole).toBe('text');
    expect(tree.props.accessibilityLabel).toBe(
      'Mức đóng góp: 0 phút, 1–24 phút, 25–49 phút, 50–99 phút, 100+ phút',
    );
    const serialized = JSON.stringify(tree);
    for (const range of ['0 phút', '1–24 phút', '25–49 phút', '50–99 phút', '100+ phút']) {
      expect(serialized).toContain(range);
    }
    expect(serialized).toContain('no-hide-descendants');
    expect(serialized).not.toMatch(/thấp|cao|đỉnh/i);
  });
});
