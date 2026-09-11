import { describe, expect, it, vi } from 'vitest';

import { HistoryStatusBadge, historyStatusLabel } from './history-status-badge';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('HistoryStatusBadge', () => {
  it.each([
    ['completed', 'Hoàn thành'],
    ['failed', 'Thất bại'],
    ['cancelled', 'Đã hủy'],
  ] as const)('renders explicit non-color-only %s copy', (status, label) => {
    expect(historyStatusLabel(status)).toBe(label);
    const tree = HistoryStatusBadge({ status });
    expect(JSON.stringify(tree)).toContain(label);
    expect(tree.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  });
});
