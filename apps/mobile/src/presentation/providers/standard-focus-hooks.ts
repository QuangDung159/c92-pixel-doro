import { useSyncExternalStore } from 'react';

import type {
  StandardFocusCancelProjection,
  StandardFocusResultProjection,
  StandardFocusSessionProjection,
  StandardFocusSetupProjection,
  StandardFocusOutcomeProjection,
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

export const useStandardFocusSessionActions = () => {
  const { standardFocusSession } = useMobileApplication();
  return {
    activate: standardFocusSession.activate,
    deactivate: standardFocusSession.deactivate,
    refresh: standardFocusSession.refresh,
  };
};

export const useStandardFocusCancelProjection = (): StandardFocusCancelProjection => {
  const { standardFocusCancel } = useMobileApplication();
  return useSyncExternalStore(
    standardFocusCancel.subscribe,
    standardFocusCancel.getSnapshot,
    standardFocusCancel.getSnapshot,
  );
};

export const useStandardFocusCancelActions = () => {
  const { standardFocusCancel } = useMobileApplication();
  return { cancel: standardFocusCancel.cancel, reset: standardFocusCancel.reset };
};

export const useStandardFocusResultProjection = (): StandardFocusResultProjection => {
  const { standardFocusResult } = useMobileApplication();
  return useSyncExternalStore(
    standardFocusResult.subscribe,
    standardFocusResult.getSnapshot,
    standardFocusResult.getSnapshot,
  );
};

export const useStandardFocusResultRefresh = () =>
  useMobileApplication().standardFocusResult.refresh;

export const useStandardFocusOutcomeProjection = (): StandardFocusOutcomeProjection => {
  const { standardFocusOutcome } = useMobileApplication();
  return useSyncExternalStore(
    standardFocusOutcome.subscribe,
    standardFocusOutcome.getSnapshot,
    standardFocusOutcome.getSnapshot,
  );
};

export const useStandardFocusOutcomeActions = () => {
  const { standardFocusOutcome } = useMobileApplication();
  return { consume: standardFocusOutcome.consume };
};

export const useStandardFocusReviewReset = () => {
  const application = useMobileApplication();
  return {
    available: application.standardFocusReviewResetAvailable,
    reset: application.resetStandardFocusReviewData,
  };
};
