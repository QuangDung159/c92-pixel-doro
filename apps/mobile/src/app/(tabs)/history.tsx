import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

import { HistoryScreen } from '@/presentation/features/history';
import {
  useHistoryActions,
  useHistoryProjection,
  useAppVisibility,
} from '@/presentation/providers/mobile-application-context';

export default function HistoryRoute() {
  const projection = useHistoryProjection();
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
  const focused = useRef(false);
  const previousVisibility = useRef(appVisibility);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void activate();
      return () => {
        focused.current = false;
        deactivate();
      };
    }, [activate, deactivate]),
  );

  useEffect(() => {
    const previous = previousVisibility.current;
    previousVisibility.current = appVisibility;
    if (focused.current && previous !== 'active' && appVisibility === 'active') {
      void refresh();
    }
  }, [appVisibility, refresh]);

  return (
    <HistoryScreen
      onLoadMore={() => void loadMore()}
      onRetryInitial={() => void retryInitial()}
      onRetryLoadMore={() => void retryLoadMore()}
      onRetryRefresh={() => void retryRefresh()}
      projection={projection}
    />
  );
}
