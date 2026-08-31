import {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';

const PetScreenVisibilityContext = createContext(true);

export interface PetScreenVisibilityProviderProps extends PropsWithChildren {
  readonly screenFocused: boolean;
}

export const PetScreenVisibilityProvider = ({
  screenFocused,
  children,
}: PetScreenVisibilityProviderProps) => (
  <PetScreenVisibilityContext.Provider value={screenFocused}>
    {children}
  </PetScreenVisibilityContext.Provider>
);

export const usePetScreenFocused = (): boolean =>
  useContext(PetScreenVisibilityContext);
