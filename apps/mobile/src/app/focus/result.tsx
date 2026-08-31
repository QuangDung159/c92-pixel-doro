import { useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { FocusResultScreen } from '@/presentation/features/focus';
import { OnboardingTrialResultScreen } from '@/presentation/features/onboarding-trial';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import {
  useDiscardPetTerminalFeedback,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetTerminalReviewFixture,
  usePetTerminalReviewFixtureAvailable,
  usePetVisualProjection,
  useOnboardingTrialResultProjection,
  useOnboardingTrialResultRefresh,
  useOnboardingTrialHandoffProjection,
  useCompleteFirstUseHandoff,
  useRetryOnboardingTrialPetFeedback,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';
import { PetRouteVisibility } from '../pet-route-visibility';

export default function FocusResultRoute() {
  const router = useRouter();
  const pet = usePetVisualProjection();
  const trialResult = useOnboardingTrialResultProjection();
  const refreshTrialResult = useOnboardingTrialResultRefresh();
  const handoff = useOnboardingTrialHandoffProjection();
  const completeFirstUseHandoff = useCompleteFirstUseHandoff();
  const retryTrialPetFeedback = useRetryOnboardingTrialPetFeedback();
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

  useFocusEffect(
    useCallback(() => {
      void refreshTrialResult();
      void refreshPet();
    }, [refreshPet, refreshTrialResult]),
  );

  const goHome = () => router.replace('/(tabs)');
  usePrototypeBack(() => {
    if (trialResult.status !== 'ready') goHome();
  });

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
