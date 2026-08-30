import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { BreakResultScreen, BreakSessionScreen } from '@/presentation/features/break';
import {
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function BreakSessionRoute() {
  const router = useRouter();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const { activeSession, breakResult, resolveBreak } = usePrototype();
  const session = activeSession?.kind === 'break' ? activeSession : null;
  const goHome = () => router.replace('/(tabs)');

  useFocusEffect(
    useCallback(() => {
      void refreshPet();
    }, [refreshPet]),
  );

  usePrototypeBack(() => {
    if (breakResult === null) setCancelRequestToken((token) => token + 1);
    else goHome();
  });

  if (breakResult !== null && session === null) {
    return <BreakResultScreen onHome={goHome} result={breakResult} />;
  }

  return (
    <BreakSessionScreen
      cancelRequestToken={cancelRequestToken}
      onMissingSession={goHome}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onRetryPet={() => void refreshPet()}
      onResolve={resolveBreak}
      pet={pet}
      session={session}
    />
  );
}
