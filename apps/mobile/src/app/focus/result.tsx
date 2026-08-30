import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { FocusResultScreen } from '@/presentation/features/focus';
import {
  useDismissPetTerminalFeedbackError,
  usePetCompanionProjection,
  usePetCompanionRefresh,
  usePetTerminalFeedbackProjection,
  usePetTerminalReviewFixture,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function FocusResultRoute() {
  const router = useRouter();
  const pet = usePetCompanionProjection();
  const petFeedback = usePetTerminalFeedbackProjection();
  const refreshPet = usePetCompanionRefresh();
  const triggerPetTerminalReviewFixture = usePetTerminalReviewFixture();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const {
    focusResult,
    nextBreakKind,
    setNextBreakKind,
    startBreak,
    startTrial,
  } = usePrototype();

  useEffect(() => {
    triggerPetTerminalReviewFixture();
  }, [triggerPetTerminalReviewFixture]);

  const goHome = () => router.replace('/(tabs)');
  usePrototypeBack(goHome);

  return (
    <FocusResultScreen
      nextBreakKind={nextBreakKind}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onHome={goHome}
      onRetryPet={() => void refreshPet()}
      onRetryFocus={() => router.replace('/focus/setup')}
      onRetryTrial={() => {
        startTrial();
        router.replace('/focus/session');
      }}
      onSetNextBreakKind={setNextBreakKind}
      onStartBreak={() => {
        startBreak();
        router.replace('/break/session');
      }}
      pet={pet}
      petFeedback={petFeedback}
      result={focusResult}
    />
  );
}
