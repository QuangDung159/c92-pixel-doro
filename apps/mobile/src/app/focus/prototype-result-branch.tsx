import { useRouter } from 'expo-router';
import type { PetVisualProjection } from '@pixeldoro/application';

import { FocusResultScreen } from '@/presentation/features/focus';
import {
  usePetTerminalReviewFixture,
  usePetTerminalReviewFixtureAvailable,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { PetRouteVisibility } from '../pet-route-visibility';
import { useSessionCancelBack } from '../use-session-cancel-back';

export interface PrototypeResultBranchProps {
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetVisualProjection;
}

export function PrototypeResultBranch({
  onDismissPetFeedbackError,
  onRetryPet,
  pet,
}: PrototypeResultBranchProps) {
  const router = useRouter();
  const triggerPetTerminalReviewFixture = usePetTerminalReviewFixture();
  const terminalReviewFixtureAvailable = usePetTerminalReviewFixtureAvailable();
  const {
    focusResult,
    nextBreakKind,
    setNextBreakKind,
    startBreak,
    startTrial,
  } = usePrototype();
  const goHome = () => router.replace('/(tabs)');
  useSessionCancelBack(goHome);

  return (
    <PetRouteVisibility>
      <FocusResultScreen
        nextBreakKind={nextBreakKind}
        onDismissPetFeedbackError={onDismissPetFeedbackError}
        onHome={goHome}
        onRetryPet={onRetryPet}
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
