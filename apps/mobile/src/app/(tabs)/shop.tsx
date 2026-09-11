import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { ShopScreen } from '@/presentation/features/shop';
import {
  useShopActions,
  useShopProjection,
} from '@/presentation/providers/mobile-application-context';

export default function ShopRoute() {
  const projection = useShopProjection();
  const {
    activate,
    confirmPurchase,
    deactivate,
    dismissPurchase,
    requestPurchase,
    retry,
    retryPurchaseRefresh,
  } = useShopActions();

  useFocusEffect(
    useCallback(() => {
      void activate();
      return deactivate;
    }, [activate, deactivate]),
  );

  return (
    <ShopScreen
      onConfirmPurchase={() => void confirmPurchase()}
      onDismissPurchase={dismissPurchase}
      onRequestPurchase={requestPurchase}
      onRetry={() => void retry()}
      onRetryPurchaseRefresh={() => void retryPurchaseRefresh()}
      projection={projection}
    />
  );
}
