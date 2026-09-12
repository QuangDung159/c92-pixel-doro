import type {
  ContributionControllerProjection,
  HistoryControllerProjection,
} from '@/application';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';

import { FocusHistoryList } from './focus-history-list';
import { ContributionPanel } from './contribution-panel';
import { HistoryRefreshStatus } from './history-refresh-status';

export interface HistoryScreenProps {
  readonly contribution: ContributionControllerProjection;
  readonly projection: HistoryControllerProjection;
  readonly onLoadMore: () => void;
  readonly onRetryInitial: () => void;
  readonly onRetryLoadMore: () => void;
  readonly onRetryRefresh: () => void;
  readonly onRetryContributionInitial: () => void;
  readonly onRetryContributionRefresh: () => void;
}

export const HistoryScreen = ({
  contribution,
  onLoadMore,
  onRetryInitial,
  onRetryLoadMore,
  onRetryRefresh,
  onRetryContributionInitial,
  onRetryContributionRefresh,
  projection,
}: HistoryScreenProps) => {
  const contributionPanel = (
    <ContributionPanel
      onRetryInitial={onRetryContributionInitial}
      onRetryRefresh={onRetryContributionRefresh}
      projection={contribution}
    />
  );
  return (
    <ScreenShell scrollable={false}>
      <ScreenHeader
        description="Nhìn lại những phiên Focus đã lưu trên thiết bị."
        eyebrow="LỊCH SỬ"
        title="Những nhịp đã qua."
      />
      {projection.status === 'idle' || projection.status === 'loading' ? (
        <LoadingState label="Đang đọc lịch sử Focus…" />
      ) : null}
      {projection.status === 'empty' ? (
        <>
          <HistoryRefreshStatus onRetry={onRetryRefresh} status={projection.refresh} />
          <FocusHistoryList
            contributionHeader={contributionPanel}
            emptyState={(
              <EmptyState
                body="Phiên Focus chuẩn đầu tiên sẽ xuất hiện ở đây. Trial và phiên nghỉ không nằm trong lịch sử này."
                title="Chưa có lịch sử Focus"
              />
            )}
            onLoadMore={onLoadMore}
            onRetryLoadMore={onRetryLoadMore}
            pagination="end"
            sections={[]}
          />
        </>
      ) : null}
      {projection.status === 'error' ? (
        <ErrorState
          body={projection.code === 'HISTORY_DATA_INVALID'
            ? 'Dữ liệu lịch sử cần được kiểm tra an toàn trước khi hiển thị.'
            : 'Chưa đọc được lịch sử trên thiết bị. Các phiên đã lưu không bị thay đổi.'}
          onRetry={onRetryInitial}
          title="Lịch sử cần thử lại"
        />
      ) : null}
      {projection.status === 'ready' ? (
        <>
          <HistoryRefreshStatus onRetry={onRetryRefresh} status={projection.refresh} />
          <FocusHistoryList
            contributionHeader={contributionPanel}
            onLoadMore={onLoadMore}
            onRetryLoadMore={onRetryLoadMore}
            pagination={projection.pagination}
            sections={projection.sections}
          />
        </>
      ) : null}
    </ScreenShell>
  );
};

export { FocusHistoryList } from './focus-history-list';
export { FocusHistoryRow, formatHistoryLocalDate } from './focus-history-row';
export { HistoryStatusBadge, historyStatusLabel } from './history-status-badge';
export { HistoryDateSectionHeader } from './history-date-section-header';
export { HistoryPaginationFooter } from './history-pagination-footer';
export { HistoryRefreshStatus } from './history-refresh-status';
export { ContributionPanel } from './contribution-panel';
export { ContributionDayRow, contributionRangeLabels } from './contribution-day-row';
export { ContributionGraphStrip } from './contribution-graph-strip';
export { ContributionLegend } from './contribution-legend';
export { contributionVisualTokens } from './contribution-visual-tokens';
