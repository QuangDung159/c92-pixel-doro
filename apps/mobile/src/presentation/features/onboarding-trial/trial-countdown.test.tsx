import { Children, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TrialCountdown } from './trial-countdown';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('TrialCountdown', () => {
  it('formats timestamp-derived running time with a stable accessibility label', () => {
    const tree = TrialCountdown({ displaySeconds: 299, pending: false });
    const children = Children.toArray(tree.props.children) as ReactElement<{
      readonly children?: unknown;
    }>[];
    expect(tree.props.accessibilityLabel).toBe('Còn 4 phút 59 giây');
    expect(children[0]?.props.children).toBe('04:59');
    expect(JSON.stringify(tree)).not.toMatch(/MOCK|Complete|Strict/);
  });

  it('renders a truthful deadline-pending state', () => {
    const tree = TrialCountdown({ displaySeconds: 0, pending: true });
    expect(tree.props.accessibilityLabel).toContain('đang chờ xác nhận kết quả');
    expect(JSON.stringify(tree)).toContain('00:00');
    expect(JSON.stringify(tree)).toContain('ĐANG XÁC NHẬN KẾT QUẢ');
  });
});
