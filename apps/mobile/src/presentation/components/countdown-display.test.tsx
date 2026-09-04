import { Children, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CountdownDisplay } from './countdown-display';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text', View: 'View',
}));

describe('CountdownDisplay', () => {
  it('formats time without a per-second live announcement', () => {
    const tree = CountdownDisplay({
      displaySeconds: 299, pending: false, runningCaption: 'ĐANG TẬP TRUNG',
    });
    const children = Children.toArray(tree.props.children) as ReactElement<Record<string, unknown>>[];
    expect(tree.props.accessibilityLabel).toBe('Còn 4 phút 59 giây');
    expect(children[0]?.props.children).toBe('04:59');
    expect(children[1]?.props.accessibilityLiveRegion).toBe('none');
  });

  it('announces the pending phase politely', () => {
    const tree = CountdownDisplay({ displaySeconds: 0, pending: true, runningCaption: 'unused' });
    expect(JSON.stringify(tree)).toContain('00:00');
    expect(JSON.stringify(tree)).toContain('ĐANG XÁC NHẬN KẾT QUẢ');
    expect(JSON.stringify(tree)).toContain('polite');
  });

  it('fails closed when presentation receives an invalid second count', () => {
    const tree = CountdownDisplay({
      displaySeconds: Number.NaN, pending: false, runningCaption: 'ĐANG TẬP TRUNG',
    });
    expect(tree.props.accessibilityLabel).toBe('Còn 0 phút 0 giây');
    expect(JSON.stringify(tree)).toContain('00:00');
  });
});
