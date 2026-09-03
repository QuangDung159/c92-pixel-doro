import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { PetVisualProjection } from '@pixeldoro/application';

import type { StandardFocusSessionProjection } from '@/application';
import {
  StandardFocusRunningScreen,
} from '@/presentation/features/focus';
import {
  useStandardFocusCancelActions,
  useStandardFocusCancelProjection,
  useStandardFocusReviewReset,
} from '@/presentation/providers/standard-focus-hooks';
import { PetRouteVisibility } from '../pet-route-visibility';

type ReadyProjection = Extract<StandardFocusSessionProjection, { readonly status: 'ready' }>;

export interface StandardFocusStartedBranchProps {
  readonly projection: ReadyProjection;
  readonly pet: PetVisualProjection;
  readonly onRetryPet: () => void;
  readonly onDismissPetFeedbackError: () => void;
  readonly cancelRequestToken?: number;
}

export const StandardFocusStartedBranch = ({
  projection,
  pet,
  onRetryPet,
  onDismissPetFeedbackError,
  cancelRequestToken = 0,
}: StandardFocusStartedBranchProps) => {
  const router = useRouter();
  const reviewReset = useStandardFocusReviewReset();
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState(false);
  const cancelProjection = useStandardFocusCancelProjection();
  const { cancel } = useStandardFocusCancelActions();

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

  const cancelError = cancelProjection.status !== 'error'
      ? null
      : cancelProjection.error.code === 'DEADLINE_REACHED'
        ? 'Phiên đã tới deadline và không thể hủy. Chưa có kết quả giả nào được tạo.'
        : cancelProjection.error.code === 'ALREADY_TERMINAL'
          ? 'Phiên đã có kết quả khác. Hãy tải lại dữ liệu đã lưu.'
          : 'Chưa thể dừng. Phiên vẫn đang chạy và dữ liệu của bạn vẫn an toàn.';
  return (
      <PetRouteVisibility>
        <StandardFocusRunningScreen
          cancelBusy={cancelProjection.status === 'submitting'}
          cancelError={cancelError}
          cancelRequestToken={cancelRequestToken}
          onConfirmCancel={() => {
            void cancel(projection.sessionId).then((result) => {
              if (result.ok) {
                router.replace({ pathname: '/focus/result', params: { sessionId: result.sessionId } });
              }
            });
          }}
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
