import { describe, expect, it, vi } from 'vitest';

import { HistoryPaginationFooter } from './history-pagination-footer';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice', SecondaryButton: 'SecondaryButton',
}));

describe('HistoryPaginationFooter', () => {
  it('renders explicit load, busy, failure Retry and truthful end states', () => {
    const actions = { onLoadMore: vi.fn(), onRetry: vi.fn() };
    expect(JSON.stringify(HistoryPaginationFooter({ status: 'idle', ...actions })))
      .toContain('Xem thêm');
    expect(JSON.stringify(HistoryPaginationFooter({ status: 'loading', ...actions })))
      .toContain('Đang tải lịch sử');
    expect(JSON.stringify(HistoryPaginationFooter({ status: 'error', ...actions })))
      .toContain('Thử tải lại');
    expect(HistoryPaginationFooter({ status: 'end', ...actions })).toBeNull();
  });
});
