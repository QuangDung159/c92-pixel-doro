import { describe, expect, it, vi } from 'vitest';

import { ContributionDayRow, contributionRangeLabels } from './contribution-day-row';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('ContributionDayRow', () => {
  it('renders exact date, minutes, count and a color-independent range label', () => {
    const tree = ContributionDayRow({ day: {
      localDate: '2026-09-12',
      completedMinutes: 50,
      completedSessionCount: 2,
      intensity: 'high',
    } });
    expect(tree.props.accessibilityLabel)
      .toBe('12/09/2026, 50 phút Focus hoàn thành, 2 phiên hoàn thành, mức 50–99 phút');
    expect(JSON.stringify(tree)).toContain('12/09');
    expect(JSON.stringify(tree)).toContain('50 phút');
    expect(JSON.stringify(tree)).toContain('2 phiên hoàn thành');
    expect(contributionRangeLabels).toEqual({
      zero: '0 phút',
      low: '1–24 phút',
      medium: '25–49 phút',
      high: '50–99 phút',
      peak: '100+ phút',
    });
  });
});
