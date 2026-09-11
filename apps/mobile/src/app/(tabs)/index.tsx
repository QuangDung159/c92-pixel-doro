import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';
import {
  useHomeProfileProjection,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
  useRoomDecorationsActions,
  useRoomDecorationsProjection,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function HomeRoute() {
  const router = useRouter();
  const profile = useHomeProfileProjection();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const room = useRoomDecorationsProjection();
  const {
    activate: activateRoom,
    deactivate: deactivateRoom,
    retry: retryRoom,
  } = useRoomDecorationsActions();

  useFocusEffect(
    useCallback(() => {
      void refreshPet();
      void activateRoom();
      return deactivateRoom;
    }, [activateRoom, deactivateRoom, refreshPet]),
  );

  return (
    <PetRouteVisibility>
      <HomeScreen
        onStartFocus={() => router.push('/focus/setup')}
        onDismissPetFeedbackError={dismissPetFeedbackError}
        onRetryPet={() => void refreshPet()}
        pet={pet}
        profile={profile}
        room={room}
        onRetryRoom={() => void retryRoom()}
      />
    </PetRouteVisibility>
  );
}
