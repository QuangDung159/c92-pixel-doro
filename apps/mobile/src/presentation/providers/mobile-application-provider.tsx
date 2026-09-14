import {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';

import type { MobileApplicationFacade } from '@/application';

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

export const useMobileApplication = (): MobileApplicationFacade => {
  const application = useContext(MobileApplicationContext);

  if (application === undefined) {
    throw new Error('MobileApplicationProvider is missing');
  }

  return application;
};
