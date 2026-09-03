import { useRouter } from 'expo-router';
import type { PetVisualProjection } from '@pixeldoro/application';

import { PrototypeFocusSessionScreen } from '@/presentation/features/focus';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export interface PrototypeSessionBranchProps {
  readonly cancelRequestToken: number;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetVisualProjection;
}

export function PrototypeSessionBranch({
  cancelRequestToken,
  onDismissPetFeedbackError,
  onRetryPet,
  pet,
}: PrototypeSessionBranchProps) {
  const router = useRouter();
  const { activeSession, resolveFocus } = usePrototype();
  const session =
    activeSession?.kind === 'trial' || activeSession?.kind === 'focus'
      ? activeSession
      : null;

  return (
    <PetRouteVisibility>
      <PrototypeFocusSessionScreen
        cancelRequestToken={cancelRequestToken}
        onMissingSession={() => router.replace('/(tabs)')}
        onDismissPetFeedbackError={onDismissPetFeedbackError}
        onRetryPet={onRetryPet}
        onResolve={(outcome) => {
          resolveFocus(outcome);
          router.replace('/focus/result');
        }}
        pet={pet}
        session={session}
      />
    </PetRouteVisibility>
  );
}
