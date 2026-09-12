import { describe, expect, it, vi } from 'vitest';

import { ScreenShell } from './screen-shell';

vi.mock('react-native', () => ({
  ScrollView: 'ScrollView',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

describe('ScreenShell', () => {
  it('keeps ScrollView as the default for existing consumers', () => {
    const tree = ScreenShell({ children: 'content' });
    expect(tree.props.children.type).toBe('ScrollView');
  });

  it('offers a fixed content branch for one virtualized child scroll owner', () => {
    const tree = ScreenShell({ children: 'content', scrollable: false });
    expect(tree.props.children.type).toBe('View');
    expect(tree.props.children.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ flex: 1 }),
    ]));
  });
});
