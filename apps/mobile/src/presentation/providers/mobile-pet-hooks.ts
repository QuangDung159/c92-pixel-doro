import { useSyncExternalStore } from 'react';
import type {
  PetCompanionProjection,
  PetTerminalFeedbackProjection,
  PetVisualProjection,
} from '@pixeldoro/application';

import type { AppLifecycleState, PetVisualDiagnostic } from '@/application';

import { useMobileApplication } from './mobile-application-provider';

export const usePetCompanionProjection = (): PetCompanionProjection => {
  const { petCompanion } = useMobileApplication();
  return useSyncExternalStore(
    petCompanion.subscribe,
    petCompanion.getSnapshot,
    petCompanion.getSnapshot,
  );
};

export const usePetCompanionRefresh = (): (() => Promise<void>) =>
  useMobileApplication().refreshPetCompanion;

export const usePetTerminalFeedbackProjection = (): PetTerminalFeedbackProjection => {
  const { petTerminalFeedback } = useMobileApplication();
  return useSyncExternalStore(
    petTerminalFeedback.subscribe,
    petTerminalFeedback.getSnapshot,
    petTerminalFeedback.getSnapshot,
  );
};

export const usePetVisualProjection = (): PetVisualProjection => {
  const { petVisual } = useMobileApplication();
  return useSyncExternalStore(
    petVisual.subscribe,
    petVisual.getSnapshot,
    petVisual.getSnapshot,
  );
};

export const useAppVisibility = (): AppLifecycleState => {
  const { appVisibility } = useMobileApplication();
  return useSyncExternalStore(
    appVisibility.subscribe,
    appVisibility.getSnapshot,
    appVisibility.getSnapshot,
  );
};

export interface PetVisualPlaybackCallbacks {
  readonly reportComplete: (feedbackId: string) => void;
  readonly reportFailure: (feedbackId: string) => void;
}

export const usePetVisualPlaybackCallbacks = (): PetVisualPlaybackCallbacks => {
  const { reportPetVisualComplete, reportPetVisualFailure } = useMobileApplication();
  return {
    reportComplete: reportPetVisualComplete,
    reportFailure: reportPetVisualFailure,
  };
};

export const usePetVisualDiagnostics = (): ((diagnostic: PetVisualDiagnostic) => void) =>
  useMobileApplication().recordPetVisualDiagnostic;

export const usePetTerminalReviewFixture = (): (() => Promise<void>) =>
  useMobileApplication().triggerPetTerminalReviewFixture;

export const usePetTerminalReviewFixtureAvailable = (): boolean =>
  useMobileApplication().petTerminalReviewFixtureAvailable;

export const useDiscardPetTerminalFeedback = (): (() => void) =>
  useMobileApplication().discardPetTerminalFeedback;

export const useDismissPetTerminalFeedbackError = (): (() => void) =>
  useMobileApplication().dismissPetTerminalFeedbackError;
