import { useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { OnboardingTrialResultScreen } from '@/presentation/features/onboarding-trial';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import {
  useDiscardPetTerminalFeedback,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
  useOnboardingTrialResultProjection,
  useOnboardingTrialResultRefresh,
  useOnboardingTrialHandoffProjection,
  useCompleteFirstUseHandoff,
  useRetryOnboardingTrialPetFeedback,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';
import { PrototypeResultBranch } from './prototype-result-branch';

export default function FocusResultRoute() {
  const router = useRouter();
  const pet = usePetVisualProjection();
  const trialResult = useOnboardingTrialResultProjection();
  const refreshTrialResult = useOnboardingTrialResultRefresh();
  const handoff = useOnboardingTrialHandoffProjection();
  const completeFirstUseHandoff = useCompleteFirstUseHandoff();
  const retryTrialPetFeedback = useRetryOnboardingTrialPetFeedback();
  const refreshPet = usePetCompanionRefresh();
  const discardPetTerminalFeedback = useDiscardPetTerminalFeedback();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();

  useEffect(() => {
    return discardPetTerminalFeedback;
  }, [discardPetTerminalFeedback]);

  useFocusEffect(
    useCallback(() => {
      void refreshTrialResult();
      void refreshPet();
    }, [refreshPet, refreshTrialResult]),
  );

  if (trialResult.status === 'idle' || trialResult.status === 'loading') {
    return (
      <ScreenShell>
        <LoadingState label="Đang đọc kết quả đã ghi nhận…" />
      </ScreenShell>
    );
  }

  if (trialResult.status === 'error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Phần thưởng không bị cấp lại. Hãy thử đọc lại kết quả đã lưu."
          onRetry={() => void refreshTrialResult()}
          title="Chưa thể đọc kết quả"
        />
      </ScreenShell>
    );
  }

  if (trialResult.status === 'ready') {
    return (
      <PetRouteVisibility>
        <OnboardingTrialResultScreen
          continueBusy={handoff.status === 'submitting'}
          continueError={handoff.status === 'error'}
          onContinue={() => {
            void completeFirstUseHandoff(trialResult.result).then((completed) => {
              if (completed.ok) router.replace('/(tabs)');
            });
          }}
          onDismissPetFeedbackError={dismissPetFeedbackError}
          onRetryPet={() => void retryTrialPetFeedback()}
          pet={pet}
          result={trialResult.result}
        />
      </PetRouteVisibility>
    );
  }

  return (
    <PrototypeResultBranch
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onRetryPet={() => void refreshPet()}
      pet={pet}
    />
  );
}
