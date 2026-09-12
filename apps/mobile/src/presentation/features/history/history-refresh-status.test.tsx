import { describe, expect, it, vi } from 'vitest';

import { HistoryRefreshStatus } from './history-refresh-status';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice', SecondaryButton: 'SecondaryButton',
}));

describe('HistoryRefreshStatus', () => {
  it('keeps refresh status local and actionable', () => {
    const onRetry = vi.fn();
    expect(HistoryRefreshStatus({ status: 'idle', onRetry })).toBeNull();
    expect(JSON.stringify(HistoryRefreshStatus({ status: 'refreshing', onRetry })))
      .toContain('Đang cập nhật lịch sử');
    const error = JSON.stringify(HistoryRefreshStatus({ status: 'error', onRetry }));
    expect(error).toContain('Chưa cập nhật được lịch sử mới nhất');
    expect(error).toContain('Thử lại');
  });
});
