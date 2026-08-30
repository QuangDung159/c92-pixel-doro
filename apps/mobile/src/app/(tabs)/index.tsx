import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';
import {
  useHomeProfileProjection,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function HomeRoute() {
  const router = useRouter();
  const profile = useHomeProfileProjection();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();

  useFocusEffect(
    useCallback(() => {
      void refreshPet();
    }, [refreshPet]),
  );

  return (
    <PetRouteVisibility>
      <HomeScreen
        onStartFocus={() => router.push('/focus/setup')}
        onDismissPetFeedbackError={dismissPetFeedbackError}
        onRetryPet={() => void refreshPet()}
        pet={pet}
        profile={profile}
      />
    </PetRouteVisibility>
  );
}
