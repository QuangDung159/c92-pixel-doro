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
} from '@pixeldoro/application';

import type {
  BootstrapProjection,
  MobileApplicationFacade,
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
