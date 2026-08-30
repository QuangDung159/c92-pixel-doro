import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';
import {
  useHomeProfileProjection,
  usePetCompanionProjection,
  usePetCompanionRefresh,
} from '@/presentation/providers/mobile-application-context';

export default function HomeRoute() {
  const router = useRouter();
  const profile = useHomeProfileProjection();
  const pet = usePetCompanionProjection();
  const refreshPet = usePetCompanionRefresh();

  useFocusEffect(
    useCallback(() => {
      void refreshPet();
    }, [refreshPet]),
  );

  return (
    <HomeScreen
      onStartFocus={() => router.push('/focus/setup')}
      onRetryPet={() => void refreshPet()}
      pet={pet}
      profile={profile}
    />
  );
}
