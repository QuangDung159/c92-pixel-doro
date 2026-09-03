import { useCallback, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

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
import {
  useStandardFocusResultProjection,
  useStandardFocusResultRefresh,
} from '@/presentation/providers/standard-focus-hooks';

import { PetRouteVisibility } from '../pet-route-visibility';
import { PrototypeResultBranch } from './prototype-result-branch';
import { StandardFocusCancelledResultBranch } from './standard-focus-cancelled-result-branch';

export default function FocusResultRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ readonly sessionId?: string | string[] }>();
  const standardResultRequested = params.sessionId !== undefined;
  const standardSessionId = typeof params.sessionId === 'string' ? params.sessionId : null;
  const pet = usePetVisualProjection();
  const trialResult = useOnboardingTrialResultProjection();
  const refreshTrialResult = useOnboardingTrialResultRefresh();
  const handoff = useOnboardingTrialHandoffProjection();
  const completeFirstUseHandoff = useCompleteFirstUseHandoff();
  const retryTrialPetFeedback = useRetryOnboardingTrialPetFeedback();
  const refreshPet = usePetCompanionRefresh();
  const discardPetTerminalFeedback = useDiscardPetTerminalFeedback();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const standardResult = useStandardFocusResultProjection();
  const refreshStandardResult = useStandardFocusResultRefresh();

  useEffect(() => {
    return discardPetTerminalFeedback;
  }, [discardPetTerminalFeedback]);

  useFocusEffect(
    useCallback(() => {
      if (!standardResultRequested) void refreshTrialResult();
      else if (standardSessionId !== null) void refreshStandardResult(standardSessionId);
      void refreshPet();
    }, [
      refreshPet, refreshStandardResult, refreshTrialResult,
      standardResultRequested, standardSessionId,
    ]),
  );

  if (standardResultRequested && standardSessionId === null) {
    return (
      <ScreenShell>
        <ErrorState
          body="Định danh kết quả không hợp lệ. PixelDoro sẽ không dùng một phiên khác thay thế."
          onRetry={() => router.replace('/(tabs)')}
          title="Chưa thể mở kết quả"
        />
      </ScreenShell>
    );
  }

  if (standardSessionId !== null) {
    if (standardResult.status === 'idle' || standardResult.status === 'loading') {
      return <ScreenShell><LoadingState label="Đang đọc phiên đã dừng…" /></ScreenShell>;
    }
    if (standardResult.status === 'ready') {
      return (
        <StandardFocusCancelledResultBranch
          onDismissPetFeedbackError={dismissPetFeedbackError}
          onRetryPet={() => void refreshPet()}
          pet={pet}
          result={standardResult.result}
        />
      );
    }
    if (standardResult.status === 'error' || standardResult.status === 'missing') {
      return (
        <ScreenShell>
          <ErrorState
            body="Không tìm thấy kết quả phù hợp. Dữ liệu khác trên thiết bị không bị dùng thay thế."
            onRetry={() => void refreshStandardResult(standardSessionId)}
            title="Chưa thể đọc kết quả đã dừng"
          />
        </ScreenShell>
      );
    }
    return <ScreenShell><LoadingState label="Đang đọc phiên đã dừng…" /></ScreenShell>;
  }

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
