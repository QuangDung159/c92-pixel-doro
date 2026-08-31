import {
  createContext,
  type PropsWithChildren,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  createHomeProfileProjection,
  type HomeProfileProjection,
  type PetCompanionProjection,
  type PetTerminalFeedbackProjection,
  type PetVisualProjection,
} from '@pixeldoro/application';

import type {
  AppLifecycleState,
  BootstrapProjection,
  FirstUseEntryProjection,
  MobileApplicationFacade,
  PetVisualDiagnostic,
} from '@/application';

const MobileApplicationContext = createContext<MobileApplicationFacade | undefined>(undefined);

export interface MobileApplicationProviderProps extends PropsWithChildren {
  readonly application: MobileApplicationFacade;
}

export const MobileApplicationProvider = ({
  application,
  children,
}: MobileApplicationProviderProps) => (
  <MobileApplicationContext.Provider value={application}>
    {children}
  </MobileApplicationContext.Provider>
);

const useMobileApplication = (): MobileApplicationFacade => {
  const application = useContext(MobileApplicationContext);

  if (application === undefined) {
    throw new Error('MobileApplicationProvider is missing');
  }

  return application;
};

export const useBootstrapProjection = (): BootstrapProjection => {
  const { bootstrap } = useMobileApplication();

  return useSyncExternalStore(
    bootstrap.subscribe,
    bootstrap.getSnapshot,
    bootstrap.getSnapshot,
  );
};

export const useRecoveryRetry = (): (() => Promise<void>) => {
  const { retryRecovery } = useMobileApplication();
  return retryRecovery;
};

export const useFirstUseEntryProjection = (): FirstUseEntryProjection => {
  const { firstUseEntry } = useMobileApplication();
  return useSyncExternalStore(
    firstUseEntry.subscribe,
    firstUseEntry.getSnapshot,
    firstUseEntry.getSnapshot,
  );
};

export const useFirstUseEntryRefresh = (): (() => Promise<void>) => {
  const { refreshFirstUseEntry } = useMobileApplication();
  return refreshFirstUseEntry;
};

export const useHomeProfileProjection = (): HomeProfileProjection | null => {
  const projection = useBootstrapProjection();
  if (projection.status !== 'ready') return null;
  return createHomeProfileProjection(projection.snapshot.profile);
};

export const usePetCompanionProjection = (): PetCompanionProjection => {
  const { petCompanion } = useMobileApplication();
  return useSyncExternalStore(
    petCompanion.subscribe,
    petCompanion.getSnapshot,
    petCompanion.getSnapshot,
  );
};

export const usePetCompanionRefresh = (): (() => Promise<void>) => {
  const { refreshPetCompanion } = useMobileApplication();
  return refreshPetCompanion;
};

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
  const { reportPetVisualComplete, reportPetVisualFailure } =
    useMobileApplication();
  return {
    reportComplete: reportPetVisualComplete,
    reportFailure: reportPetVisualFailure,
  };
};

export const usePetVisualDiagnostics = (): ((
  diagnostic: PetVisualDiagnostic,
) => void) => useMobileApplication().recordPetVisualDiagnostic;

export const usePetTerminalReviewFixture = (): (() => Promise<void>) => {
  const { triggerPetTerminalReviewFixture } = useMobileApplication();
  return triggerPetTerminalReviewFixture;
};

export const usePetTerminalReviewFixtureAvailable = (): boolean => {
  const { petTerminalReviewFixtureAvailable } = useMobileApplication();
  return petTerminalReviewFixtureAvailable;
};

export const useDiscardPetTerminalFeedback = (): (() => void) => {
  const { discardPetTerminalFeedback } = useMobileApplication();
  return discardPetTerminalFeedback;
};

export const useDismissPetTerminalFeedbackError = (): (() => void) => {
  const { dismissPetTerminalFeedbackError } = useMobileApplication();
  return dismissPetTerminalFeedbackError;
};
