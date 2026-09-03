import { useRouter } from 'expo-router';
import type { PetVisualProjection, StandardFocusCancelledResult } from '@pixeldoro/application';

import { StandardFocusCancelledResultScreen } from '@/presentation/features/focus';
import { PetRouteVisibility } from '../pet-route-visibility';

export interface StandardFocusCancelledResultBranchProps {
  readonly result: StandardFocusCancelledResult;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
}

export const StandardFocusCancelledResultBranch = ({
  result, pet, onDismissPetFeedbackError, onRetryPet,
}: StandardFocusCancelledResultBranchProps) => {
  const router = useRouter();
  return (
    <PetRouteVisibility>
      <StandardFocusCancelledResultScreen
        onDismissPetFeedbackError={onDismissPetFeedbackError}
        onHome={() => router.replace('/(tabs)')}
        onRetryPet={onRetryPet}
        pet={pet}
        result={result}
      />
    </PetRouteVisibility>
  );
};
