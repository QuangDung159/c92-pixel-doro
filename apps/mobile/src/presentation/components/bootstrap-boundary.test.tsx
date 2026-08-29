import { Children, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RecoveryBoundaryContent } from './bootstrap-boundary';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

interface PressableTestProps {
  readonly accessibilityLabel: string;
  readonly accessibilityRole: string;
  readonly onPress: () => void;
}

describe('RecoveryBoundaryContent', () => {
  it('offers one accessible Retry action without rendering technical details', () => {
    const onRetry = vi.fn();
    const tree = RecoveryBoundaryContent({ onRetry });
    const children = Children.toArray(tree.props.children);
    const retry = children.find(
      (child): child is ReactElement<PressableTestProps> =>
        isValidElement(child) && child.type === 'Pressable',
    );

    expect(tree.props).toMatchObject({
      accessibilityRole: 'alert',
      accessibilityLabel: 'Không thể khởi động PixelDoro',
    });
    expect(retry?.props).toMatchObject({
      accessibilityRole: 'button',
      accessibilityLabel: 'Thử lại khởi động PixelDoro',
    });
    retry?.props.onPress();
    expect(onRetry).toHaveBeenCalledOnce();

    const rendered = JSON.stringify(tree);
    expect(rendered).not.toContain('DATABASE_');
    expect(rendered).not.toContain('sqlite');
    expect(rendered).not.toContain('stack');
  });
});
