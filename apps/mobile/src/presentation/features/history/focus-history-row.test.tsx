import { describe, expect, it, vi } from 'vitest';

import { FocusHistoryRow, formatHistoryLocalDate } from './focus-history-row';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('FocusHistoryRow', () => {
  it.each([
    ['coding', 'Lập trình'],
    ['study', 'Học tập'],
    ['writing', 'Viết'],
    ['reading', 'Đọc'],
  ] as const)('renders localized %s row semantics', (workTag, label) => {
    const tree = FocusHistoryRow({
      item: {
        id: `row-${workTag}`,
        status: 'cancelled',
        workTag,
        configuredDurationMinutes: 120,
        endsAt: 1_000,
        scheduledEndLocalDate: '2026-09-11',
      },
    });
    expect(tree.props).toMatchObject({
      accessible: true,
      accessibilityRole: 'text',
      accessibilityLabel: `11/09/2026, 120 phút, ${label}, Đã hủy`,
    });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(' phút · ');
    expect(serialized).toContain(label);
    expect(serialized).not.toMatch(/XP|Coin|Strict|Relax/);
  });

  it('formats the persisted local-day string without timezone conversion', () => {
    expect(formatHistoryLocalDate('2024-02-29')).toBe('29/02/2024');
  });
});
