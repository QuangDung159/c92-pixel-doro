import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
}));

describe('Button', () => {
  it('exposes the reusable accessibility contract and action', () => {
    const onPress = vi.fn();
    const tree = Button({ label: 'Bắt đầu', onPress, busy: false });

    expect(tree.props).toMatchObject({
      accessibilityLabel: 'Bắt đầu',
      accessibilityRole: 'button',
      accessibilityState: { busy: false, disabled: false },
      disabled: false,
    });
    tree.props.onPress();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('disables interaction while busy', () => {
    const tree = Button({ label: 'Đang mở', onPress: vi.fn(), busy: true });
    expect(tree.props).toMatchObject({
      accessibilityState: { busy: true, disabled: true },
      disabled: true,
    });
  });
});
