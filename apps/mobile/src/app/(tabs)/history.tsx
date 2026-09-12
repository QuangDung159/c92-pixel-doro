import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

import { HistoryScreen } from '@/presentation/features/history';
import {
  useHistoryActions,
  useHistoryContributionActions,
  useHistoryContributionProjection,
  useHistoryProjection,
  useAppVisibility,
} from '@/presentation/providers/mobile-application-context';

export default function HistoryRoute() {
  const projection = useHistoryProjection();
  const contribution = useHistoryContributionProjection();
  const appVisibility = useAppVisibility();
  const {
    activate,
    deactivate,
    loadMore,
    refresh,
    retryInitial,
    retryLoadMore,
    retryRefresh,
  } = useHistoryActions();
  const {
    activate: activateContribution,
    deactivate: deactivateContribution,
    refresh: refreshContribution,
    retryInitial: retryContributionInitial,
    retryRefresh: retryContributionRefresh,
  } = useHistoryContributionActions();
  const focused = useRef(false);
  const previousVisibility = useRef(appVisibility);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void Promise.all([activate(), activateContribution()]);
      return () => {
        focused.current = false;
        deactivate();
        deactivateContribution();
      };
    }, [activate, activateContribution, deactivate, deactivateContribution]),
  );

  useEffect(() => {
    const previous = previousVisibility.current;
    previousVisibility.current = appVisibility;
    if (focused.current && previous !== 'active' && appVisibility === 'active') {
      void Promise.all([refresh(), refreshContribution()]);
    }
  }, [appVisibility, refresh, refreshContribution]);

  return (
    <HistoryScreen
      contribution={contribution}
      onLoadMore={() => void loadMore()}
      onRetryInitial={() => void retryInitial()}
      onRetryContributionInitial={() => void retryContributionInitial()}
      onRetryContributionRefresh={() => void retryContributionRefresh()}
      onRetryLoadMore={() => void retryLoadMore()}
      onRetryRefresh={() => void retryRefresh()}
      projection={projection}
    />
  );
}
