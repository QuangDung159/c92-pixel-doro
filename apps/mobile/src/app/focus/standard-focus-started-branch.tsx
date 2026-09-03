import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { PetVisualProjection } from '@pixeldoro/application';

import type { StandardFocusSessionProjection } from '@/application';
import { StandardFocusStartedScreen } from '@/presentation/features/focus';
import { useStandardFocusReviewReset } from '@/presentation/providers/standard-focus-hooks';
import { PetRouteVisibility } from '../pet-route-visibility';

type ReadyProjection = Extract<StandardFocusSessionProjection, { readonly status: 'ready' }>;

export interface StandardFocusStartedBranchProps {
  readonly projection: ReadyProjection;
  readonly pet: PetVisualProjection;
  readonly onRetryPet: () => void;
  readonly onDismissPetFeedbackError: () => void;
}

export const StandardFocusStartedBranch = ({
  projection,
  pet,
  onRetryPet,
  onDismissPetFeedbackError,
}: StandardFocusStartedBranchProps) => {
  const router = useRouter();
  const reviewReset = useStandardFocusReviewReset();
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState(false);

  const resetReviewData = (): void => {
    if (resetBusy) return;
    setResetBusy(true);
    setResetError(false);
    void reviewReset.reset().then((reset) => {
      if (reset) {
        router.replace('/(onboarding)');
      } else {
        setResetError(true);
      }
    }).catch(() => setResetError(true)).finally(() => setResetBusy(false));
  };

  return (
    <PetRouteVisibility>
      <StandardFocusStartedScreen
        onDismissPetFeedbackError={onDismissPetFeedbackError}
        onResetReviewData={resetReviewData}
        onRetryPet={onRetryPet}
        pet={pet}
        projection={projection}
        reviewResetAvailable={reviewReset.available}
        reviewResetBusy={resetBusy}
        reviewResetError={resetError}
      />
    </PetRouteVisibility>
  );
};
