import { useSyncExternalStore } from 'react';

import type {
  OnboardingTrialCompletionProjection,
  OnboardingTrialHandoffProjection,
  OnboardingTrialResultProjection,
  OnboardingTrialRunningProjection,
} from '@/application';

import { useMobileApplication } from './mobile-application-provider';

export const useOnboardingTrialRunningProjection = (): OnboardingTrialRunningProjection => {
  const { onboardingTrialRunning } = useMobileApplication();
  return useSyncExternalStore(
    onboardingTrialRunning.subscribe,
    onboardingTrialRunning.getSnapshot,
    onboardingTrialRunning.getSnapshot,
  );
};

export const useOnboardingTrialRunningActions = () => {
  const { onboardingTrialRunning, refreshOnboardingTrialRunning } = useMobileApplication();
  return {
    activate: onboardingTrialRunning.activate,
    deactivate: onboardingTrialRunning.deactivate,
    refresh: refreshOnboardingTrialRunning,
  };
};

export const useOnboardingTrialCompletionProjection = (): OnboardingTrialCompletionProjection => {
  const { onboardingTrialCompletion } = useMobileApplication();
  return useSyncExternalStore(
    onboardingTrialCompletion.subscribe,
    onboardingTrialCompletion.getSnapshot,
    onboardingTrialCompletion.getSnapshot,
  );
};

export const useOnboardingTrialCompletionActions = () => {
  const { reconcileOnboardingTrial, retryOnboardingTrialCompletion } = useMobileApplication();
  return {
    reconcile: reconcileOnboardingTrial,
    retry: retryOnboardingTrialCompletion,
  };
};

export const useOnboardingTrialResultProjection = (): OnboardingTrialResultProjection => {
  const { onboardingTrialResult } = useMobileApplication();
  return useSyncExternalStore(
    onboardingTrialResult.subscribe,
    onboardingTrialResult.getSnapshot,
    onboardingTrialResult.getSnapshot,
  );
};

export const useOnboardingTrialResultRefresh = (): (() => Promise<void>) =>
  useMobileApplication().refreshOnboardingTrialResult;

export const useOnboardingTrialHandoffProjection = (): OnboardingTrialHandoffProjection => {
  const { onboardingTrialHandoff } = useMobileApplication();
  return useSyncExternalStore(
    onboardingTrialHandoff.subscribe,
    onboardingTrialHandoff.getSnapshot,
    onboardingTrialHandoff.getSnapshot,
  );
};

export const useCompleteFirstUseHandoff = () =>
  useMobileApplication().completeFirstUseHandoff;

export const useRetryOnboardingTrialPetFeedback = (): (() => Promise<void>) =>
  useMobileApplication().retryOnboardingTrialPetFeedback;

export const useStartOnboardingTrial = () =>
  useMobileApplication().startOnboardingTrial;

export const useCancelOnboardingTrial = () =>
  useMobileApplication().cancelOnboardingTrial;
