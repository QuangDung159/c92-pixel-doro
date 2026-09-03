import { useSyncExternalStore } from 'react';

import type {
  StandardFocusSessionProjection,
  StandardFocusSetupProjection,
} from '@/application';
import { useMobileApplication } from './mobile-application-context';

export const useStandardFocusSetupProjection = (): StandardFocusSetupProjection => {
  const { standardFocusSetup } = useMobileApplication();
  return useSyncExternalStore(
    standardFocusSetup.subscribe,
    standardFocusSetup.getSnapshot,
    standardFocusSetup.getSnapshot,
  );
};

export const useStandardFocusSetupActions = () => {
  const { standardFocusSetup } = useMobileApplication();
  return {
    reset: standardFocusSetup.reset,
    setDuration: standardFocusSetup.setDuration,
    setMode: standardFocusSetup.setMode,
    setWorkTag: standardFocusSetup.setWorkTag,
    start: standardFocusSetup.start,
  };
};

export const useStandardFocusSessionProjection = (): StandardFocusSessionProjection => {
  const { standardFocusSession } = useMobileApplication();
  return useSyncExternalStore(
    standardFocusSession.subscribe,
    standardFocusSession.getSnapshot,
    standardFocusSession.getSnapshot,
  );
};

export const useStandardFocusSessionRefresh = (): (() => Promise<void>) =>
  useMobileApplication().standardFocusSession.refresh;

export const useStandardFocusReviewReset = () => {
  const application = useMobileApplication();
  return {
    available: application.standardFocusReviewResetAvailable,
    reset: application.resetStandardFocusReviewData,
  };
};
