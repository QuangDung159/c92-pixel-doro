import type {
  FocusHistoryDateSection,
  FocusHistoryItemProjection,
} from '@pixeldoro/application';

export type HistoryRefreshState = 'idle' | 'refreshing' | 'error';
export type HistoryPaginationState = 'idle' | 'loading' | 'error' | 'end';

export type HistoryControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly refresh: HistoryRefreshState }
  | {
      readonly status: 'ready';
      readonly sections: readonly FocusHistoryDateSection[];
      readonly refresh: HistoryRefreshState;
      readonly pagination: HistoryPaginationState;
    }
  | {
      readonly status: 'error';
      readonly code: 'HISTORY_READ_FAILED' | 'HISTORY_DATA_INVALID';
    };

export const sameHistoryItem = (
  left: FocusHistoryItemProjection,
  right: FocusHistoryItemProjection,
): boolean => left.id === right.id && left.status === right.status &&
  left.workTag === right.workTag &&
  left.configuredDurationMinutes === right.configuredDurationMinutes &&
  left.endsAt === right.endsAt &&
  left.scheduledEndLocalDate === right.scheduledEndLocalDate;
