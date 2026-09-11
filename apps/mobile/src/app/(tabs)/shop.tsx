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
    dismissEquipNotice,
    dismissPurchase,
    requestPurchase,
    retry,
    retryPurchaseRefresh,
    retryEquipRefresh,
    setItemEquipped,
    setViewMode,
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
      onDismissEquipNotice={dismissEquipNotice}
      onRequestPurchase={requestPurchase}
      onRetry={() => void retry()}
      onRetryPurchaseRefresh={() => void retryPurchaseRefresh()}
      onRetryEquipRefresh={() => void retryEquipRefresh()}
      onSetItemEquipped={(itemId, isEquipped) => void setItemEquipped(itemId, isEquipped)}
      onSetViewMode={setViewMode}
      projection={projection}
    />
  );
}
