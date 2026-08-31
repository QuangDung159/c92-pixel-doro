import { Children, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RecoveryBoundaryContent } from './bootstrap-boundary';
import { ErrorState } from './status-surface';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

interface ErrorStateTestProps {
  readonly title: string;
  readonly body: string;
  readonly onRetry: () => void;
}

describe('RecoveryBoundaryContent', () => {
  it('offers one accessible Retry action without rendering technical details', () => {
    const onRetry = vi.fn();
    const tree = RecoveryBoundaryContent({ onRetry });
    const children = Children.toArray(tree.props.children);
    const errorState = children.find(
      (child): child is ReactElement<ErrorStateTestProps> =>
        isValidElement(child) && child.type === ErrorState,
    );

    expect(tree.props).toMatchObject({
      accessibilityRole: 'alert',
      accessibilityLabel: 'Không thể khởi động PixelDoro',
    });
    expect(errorState?.props).toMatchObject({
      title: 'PixelDoro chưa thể sẵn sàng',
      body: 'Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử lại để tiếp tục.',
    });
    errorState?.props.onRetry();
    expect(onRetry).toHaveBeenCalledOnce();

    const rendered = JSON.stringify(tree);
    expect(rendered).not.toContain('DATABASE_');
    expect(rendered).not.toContain('sqlite');
    expect(rendered).not.toContain('stack');
  });
});
