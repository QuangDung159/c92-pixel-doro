import {
  createContext,
  type PropsWithChildren,
  useContext,
  useSyncExternalStore,
} from 'react';

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
