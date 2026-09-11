import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { HistoryScreen } from '@/presentation/features/history';
import {
  useHistoryActions,
  useHistoryProjection,
} from '@/presentation/providers/mobile-application-context';

export default function HistoryRoute() {
  const projection = useHistoryProjection();
  const { activate, deactivate, retry } = useHistoryActions();

  useFocusEffect(
    useCallback(() => {
      void activate();
      return deactivate;
    }, [activate, deactivate]),
  );

  return (
    <HistoryScreen
      onRetry={() => void retry()}
      projection={projection}
    />
  );
}
