import { useSyncExternalStore } from 'react';
import {
  createHomeProfileProjection,
  type HomeProfileProjection,
} from '@pixeldoro/application';

import type {
  ContributionControllerProjection,
  HistoryControllerProjection,
  RoomDecorationsControllerProjection,
  ShopControllerProjection,
} from '@/application';

import { useBootstrapProjection } from './mobile-bootstrap-hooks';
import { useMobileApplication } from './mobile-application-provider';

export const useHomeProfileProjection = (): HomeProfileProjection | null => {
  const projection = useBootstrapProjection();
  if (projection.status !== 'ready') return null;
  return createHomeProfileProjection(projection.snapshot.profile);
};

export const useShopProjection = (): ShopControllerProjection => {
  const { shop } = useMobileApplication();
  return useSyncExternalStore(shop.subscribe, shop.getSnapshot, shop.getSnapshot);
};

export const useShopActions = () => {
  const { shop } = useMobileApplication();
  return {
    activate: shop.activate,
    confirmPurchase: shop.confirmPurchase,
    deactivate: shop.deactivate,
    dismissEquipNotice: shop.dismissEquipNotice,
    dismissPurchase: shop.dismissPurchase,
    requestPurchase: shop.requestPurchase,
    retry: shop.retry,
    retryPurchaseRefresh: shop.retryPurchaseRefresh,
    retryEquipRefresh: shop.retryEquipRefresh,
    setItemEquipped: shop.setItemEquipped,
    setViewMode: shop.setViewMode,
  };
};

export const useRoomDecorationsProjection = (): RoomDecorationsControllerProjection => {
  const { roomDecorations } = useMobileApplication();
  return useSyncExternalStore(
    roomDecorations.subscribe,
    roomDecorations.getSnapshot,
    roomDecorations.getSnapshot,
  );
};

export const useRoomDecorationsActions = () => {
  const { roomDecorations } = useMobileApplication();
  return {
    activate: roomDecorations.activate,
    deactivate: roomDecorations.deactivate,
    retry: roomDecorations.retry,
  };
};

export const useHistoryProjection = (): HistoryControllerProjection => {
  const { history } = useMobileApplication();
  return useSyncExternalStore(history.subscribe, history.getSnapshot, history.getSnapshot);
};

export const useHistoryActions = () => {
  const { history } = useMobileApplication();
  return {
    activate: history.activate,
    deactivate: history.deactivate,
    loadMore: history.loadMore,
    refresh: history.refresh,
    retryInitial: history.retryInitial,
    retryLoadMore: history.retryLoadMore,
    retryRefresh: history.retryRefresh,
  };
};

export const useHistoryContributionProjection = (): ContributionControllerProjection => {
  const { historyContribution } = useMobileApplication();
  return useSyncExternalStore(
    historyContribution.subscribe,
    historyContribution.getSnapshot,
    historyContribution.getSnapshot,
  );
};

export const useHistoryContributionActions = () => {
  const { historyContribution } = useMobileApplication();
  return {
    activate: historyContribution.activate,
    deactivate: historyContribution.deactivate,
    refresh: historyContribution.refresh,
    retryInitial: historyContribution.retryInitial,
    retryRefresh: historyContribution.retryRefresh,
  };
};
