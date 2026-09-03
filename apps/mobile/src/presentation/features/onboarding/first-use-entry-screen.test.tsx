import { Children, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FirstUseEntryScreen } from './first-use-entry-screen';

vi.mock('@/presentation/components', () => ({
  ErrorState: 'ErrorState',
  LoadingState: 'LoadingState',
  ScreenShell: 'ScreenShell',
}));

describe('FirstUseEntryScreen', () => {
  it('renders neutral loading and redirecting states', () => {
    const loading = FirstUseEntryScreen({
      projection: { status: 'loading' },
      onRetry: vi.fn(),
    });
    const loadingChild = Children.only(loading.props.children) as ReactElement<{
      readonly label: string;
    }>;
    expect(loadingChild.type).toBe('LoadingState');
    expect(loadingChild.props.label).toBe('Đang kiểm tra hành trình đầu tiên…');

    const redirecting = FirstUseEntryScreen({
      projection: { status: 'ready', destination: 'home' },
      onRetry: vi.fn(),
    });
    const redirectingChild = Children.only(
      redirecting.props.children,
    ) as ReactElement<{ readonly label: string }>;
    expect(redirectingChild.type).toBe('LoadingState');
    expect(redirectingChild.props.label).toBe('Đang mở không gian của bạn…');
  });

  it('renders safe recovery copy and connects Retry', () => {
    const onRetry = vi.fn();
    const tree = FirstUseEntryScreen({
      projection: {
        status: 'error',
        error: { code: 'FIRST_USE_ENTRY_READ_FAILED' },
      },
      onRetry,
    });
    const child = Children.only(tree.props.children);
    expect(isValidElement(child)).toBe(true);
    if (!isValidElement(child)) return;
    const error = child as ReactElement<{
      readonly title: string;
      readonly body: string;
      readonly onRetry: () => void;
    }>;
    expect(error.type).toBe('ErrorState');
    expect(error.props).toMatchObject({
      title: 'Chưa thể mở PixelDoro',
      body: 'Dữ liệu của bạn vẫn an toàn. Hãy thử lại để mở đúng không gian của bạn.',
    });
    expect(JSON.stringify(error.props)).not.toMatch(/sqlite|database|FIRST_USE_/i);
    error.props.onRetry();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
