import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { FocusSessionScreen } from '@/presentation/features/focus';
import {
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function FocusSessionRoute() {
  const router = useRouter();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const { activeSession, resolveFocus } = usePrototype();
  const session =
    activeSession?.kind === 'trial' || activeSession?.kind === 'focus'
      ? activeSession
      : null;

  useFocusEffect(
    useCallback(() => {
      void refreshPet();
    }, [refreshPet]),
  );

  usePrototypeBack(() => setCancelRequestToken((token) => token + 1));

  return (
    <FocusSessionScreen
      cancelRequestToken={cancelRequestToken}
      onMissingSession={() => router.replace('/(tabs)')}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onRetryPet={() => void refreshPet()}
      onResolve={(outcome) => {
        resolveFocus(outcome);
        router.replace('/focus/result');
      }}
      pet={pet}
      session={session}
    />
  );
}
