import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { ShopScreen } from '@/presentation/features/shop';
import {
  useShopActions,
  useShopProjection,
} from '@/presentation/providers/mobile-application-context';

export default function ShopRoute() {
  const projection = useShopProjection();
  const { activate, deactivate, retry } = useShopActions();

  useFocusEffect(
    useCallback(() => {
      void activate();
      return deactivate;
    }, [activate, deactivate]),
  );

  return <ShopScreen onRetry={() => void retry()} projection={projection} />;
}
