import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { FocusResultScreen } from '@/presentation/features/focus';
import {
  useDiscardPetTerminalFeedback,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetTerminalReviewFixture,
  usePetTerminalReviewFixtureAvailable,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';
import { PetRouteVisibility } from '../pet-route-visibility';

export default function FocusResultRoute() {
  const router = useRouter();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const triggerPetTerminalReviewFixture = usePetTerminalReviewFixture();
  const terminalReviewFixtureAvailable =
    usePetTerminalReviewFixtureAvailable();
  const discardPetTerminalFeedback = useDiscardPetTerminalFeedback();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const {
    focusResult,
    nextBreakKind,
    setNextBreakKind,
    startBreak,
    startTrial,
  } = usePrototype();

  useEffect(() => {
    return discardPetTerminalFeedback;
  }, [discardPetTerminalFeedback]);

  const goHome = () => router.replace('/(tabs)');
  usePrototypeBack(goHome);

  return (
    <PetRouteVisibility>
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
        onTriggerTerminalReviewFixture={() => {
          void triggerPetTerminalReviewFixture();
        }}
        onSetNextBreakKind={setNextBreakKind}
        onStartBreak={() => {
          startBreak();
          router.replace('/break/session');
        }}
        pet={pet}
        result={focusResult}
        terminalReviewFixtureAvailable={terminalReviewFixtureAvailable}
      />
    </PetRouteVisibility>
  );
}
