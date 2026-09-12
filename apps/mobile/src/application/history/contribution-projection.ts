import type { ContributionRangeProjection } from '@pixeldoro/application';

export type ContributionRefreshState = 'idle' | 'refreshing' | 'error';

export type ContributionControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly value: ContributionRangeProjection;
      readonly refresh: ContributionRefreshState;
    }
  | {
      readonly status: 'error';
      readonly code:
        | 'CONTRIBUTION_DATE_UNAVAILABLE'
        | 'CONTRIBUTION_READ_FAILED'
        | 'CONTRIBUTION_DATA_INVALID';
    };
