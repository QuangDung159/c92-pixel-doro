import type { PropsWithChildren } from 'react';
import { useIsFocused } from 'expo-router';

import { PetScreenVisibilityProvider } from '@/presentation/providers/pet-screen-visibility-context';

export const PetRouteVisibility = ({ children }: PropsWithChildren) => (
  <PetScreenVisibilityProvider screenFocused={useIsFocused()}>
    {children}
  </PetScreenVisibilityProvider>
);
