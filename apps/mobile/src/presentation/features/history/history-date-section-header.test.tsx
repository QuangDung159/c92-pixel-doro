import { describe, expect, it, vi } from 'vitest';

import { HistoryDateSectionHeader } from './history-date-section-header';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('HistoryDateSectionHeader', () => {
  it('shows persisted date and explicit completed-only total including zero', () => {
    const tree = HistoryDateSectionHeader({
      completedMinutes: 0,
      localDate: '2026-09-11',
    });
    expect(tree.props).toMatchObject({
      accessibilityLabel: '11/09/2026, 0 phút hoàn thành',
      accessibilityRole: 'header',
    });
    expect(JSON.stringify(tree)).toContain('0 phút hoàn thành');
  });
});
