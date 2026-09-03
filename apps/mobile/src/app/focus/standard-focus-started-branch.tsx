import type { PetVisualProjection } from '@pixeldoro/application';

import type { StandardFocusSessionProjection } from '@/application';
import { StandardFocusStartedScreen } from '@/presentation/features/focus';
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
}: StandardFocusStartedBranchProps) => (
  <PetRouteVisibility>
    <StandardFocusStartedScreen
      onDismissPetFeedbackError={onDismissPetFeedbackError}
      onRetryPet={onRetryPet}
      pet={pet}
      projection={projection}
    />
  </PetRouteVisibility>
);
