import { useSyncExternalStore } from 'react';

import type { BootstrapProjection, FirstUseEntryProjection } from '@/application';

import { useMobileApplication } from './mobile-application-provider';

export const useBootstrapProjection = (): BootstrapProjection => {
  const { bootstrap } = useMobileApplication();
  return useSyncExternalStore(
    bootstrap.subscribe,
    bootstrap.getSnapshot,
    bootstrap.getSnapshot,
  );
};

export const useRecoveryRetry = (): (() => Promise<void>) =>
  useMobileApplication().retryRecovery;

export const useRecordFocusSetupViewed = (): (() => void) =>
  useMobileApplication().recordFocusSetupViewed;

export const useRequestStoreReviewAtHome = () =>
  useMobileApplication().requestStoreReviewAtHome;

export const useEpic11ReviewFixtureAvailable = (): boolean =>
  useMobileApplication().epic11ReviewFixtureAvailable;

export const useEpic11ReviewFixtureLabel = (): string | null =>
  useMobileApplication().epic11ReviewFixtureLabel;

export const useFirstUseEntryProjection = (): FirstUseEntryProjection => {
  const { firstUseEntry } = useMobileApplication();
  return useSyncExternalStore(
    firstUseEntry.subscribe,
    firstUseEntry.getSnapshot,
    firstUseEntry.getSnapshot,
  );
};

export const useFirstUseEntryRefresh = (): (() => Promise<void>) =>
  useMobileApplication().refreshFirstUseEntry;
