import { describe, expect, it, vi } from 'vitest';

import { FocusHistoryList } from './focus-history-list';
import { HistoryScreen } from './index';

vi.mock('react-native', () => ({
  ScrollView: 'ScrollView',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

const actions = {
  onLoadMore: vi.fn(),
  onRetryInitial: vi.fn(),
  onRetryLoadMore: vi.fn(),
  onRetryRefresh: vi.fn(),
};

const findElement = (
  node: unknown,
  type: unknown,
): { readonly props: Record<string, unknown> } | undefined => {
  if (node === null || typeof node !== 'object') return undefined;
  const element = node as { readonly type?: unknown; readonly props?: Record<string, unknown> };
  if (element.type === type && element.props !== undefined) return { props: element.props };
  const children = element.props?.children;
  const candidates = Array.isArray(children) ? children : [children];
  for (const child of candidates) {
    const match = findElement(child, type);
    if (match !== undefined) return match;
  }
  return undefined;
};

describe('HistoryScreen', () => {
  it('renders truthful loading, empty and read-error states', () => {
    expect(JSON.stringify(HistoryScreen({ projection: { status: 'loading' }, ...actions })))
      .toContain('Đang đọc lịch sử Focus');
    const empty = JSON.stringify(HistoryScreen({
      projection: { status: 'empty', refresh: 'idle' }, ...actions,
    }));
    expect(empty).toContain('Chưa có lịch sử Focus');
    expect(empty).toContain('Trial và phiên nghỉ');
    const error = JSON.stringify(HistoryScreen({
      projection: { status: 'error', code: 'HISTORY_READ_FAILED' },
      ...actions,
    }));
    expect(error).toContain('Các phiên đã lưu không bị thay đổi');
  });

  it('renders the ordered production list without prototype or graph copy', () => {
    const items = [{
      id: 'session-1', status: 'completed' as const, workTag: 'coding' as const,
      configuredDurationMinutes: 25, endsAt: 2_000,
      scheduledEndLocalDate: '2026-09-11',
    }];
    const sections = [{
      localDate: '2026-09-11', completedMinutes: 25, items,
    }];
    const tree = HistoryScreen({
      projection: {
        status: 'ready', sections, refresh: 'idle', pagination: 'idle',
      },
      ...actions,
    });
    expect(findElement(tree, FocusHistoryList)?.props.sections).toBe(sections);
    expect(findElement(tree, FocusHistoryList)?.props.pagination).toBe('idle');
    expect(JSON.stringify(tree)).not.toMatch(/Prototype|mock|Contribution|7 ngày/);
  });
});
