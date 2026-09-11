import type { HistoryControllerProjection } from '@/application';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';

import { FocusHistoryList } from './focus-history-list';

export interface HistoryScreenProps {
  readonly projection: HistoryControllerProjection;
  readonly onRetry: () => void;
}

export const HistoryScreen = ({ projection, onRetry }: HistoryScreenProps) => (
  <ScreenShell>
    <ScreenHeader
      description="Nhìn lại những phiên Focus đã lưu trên thiết bị."
      eyebrow="LỊCH SỬ"
      title="Những nhịp đã qua."
    />
    {projection.status === 'idle' || projection.status === 'loading' ? (
      <LoadingState label="Đang đọc lịch sử Focus…" />
    ) : null}
    {projection.status === 'empty' ? (
      <EmptyState
        body="Phiên Focus chuẩn đầu tiên sẽ xuất hiện ở đây. Trial và phiên nghỉ không nằm trong lịch sử này."
        title="Chưa có lịch sử Focus"
      />
    ) : null}
    {projection.status === 'error' ? (
      <ErrorState
        body={projection.code === 'HISTORY_DATA_INVALID'
          ? 'Dữ liệu lịch sử cần được kiểm tra an toàn trước khi hiển thị.'
          : 'Chưa đọc được lịch sử trên thiết bị. Các phiên đã lưu không bị thay đổi.'}
        onRetry={onRetry}
        title="Lịch sử cần thử lại"
      />
    ) : null}
    {projection.status === 'ready' ? (
      <FocusHistoryList items={projection.items} />
    ) : null}
  </ScreenShell>
);

export { FocusHistoryList } from './focus-history-list';
export { FocusHistoryRow, formatHistoryLocalDate } from './focus-history-row';
export { HistoryStatusBadge, historyStatusLabel } from './history-status-badge';
