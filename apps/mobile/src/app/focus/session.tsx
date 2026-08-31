import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { FocusSessionScreen } from '@/presentation/features/focus';
import { OnboardingTrialRunningScreen } from '@/presentation/features/onboarding-trial';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import {
  useCancelOnboardingTrial,
  useDismissPetTerminalFeedbackError,
  useOnboardingTrialRunningActions,
  useOnboardingTrialRunningProjection,
  useOnboardingTrialCompletionActions,
  useOnboardingTrialCompletionProjection,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { useSessionCancelBack } from '../use-session-cancel-back';
import { PetRouteVisibility } from '../pet-route-visibility';

export default function FocusSessionRoute() {
  const router = useRouter();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelOperation = useRef<Promise<void> | null>(null);
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const cancelOnboardingTrial = useCancelOnboardingTrial();
  const trial = useOnboardingTrialRunningProjection();
  const completion = useOnboardingTrialCompletionProjection();
  const { retry: retryCompletion } = useOnboardingTrialCompletionActions();
  const {
    activate: activateTrial,
    deactivate: deactivateTrial,
    refresh: refreshTrial,
  } = useOnboardingTrialRunningActions();
  const { activeSession, resolveFocus } = usePrototype();
  const session =
    activeSession?.kind === 'trial' || activeSession?.kind === 'focus'
      ? activeSession
      : null;

  useFocusEffect(
    useCallback(() => {
      activateTrial();
      void refreshPet();
      return deactivateTrial;
    }, [activateTrial, deactivateTrial, refreshPet]),
  );

  useSessionCancelBack(() => setCancelRequestToken((token) => token + 1));

  useEffect(() => {
    if (completion.status === 'committed') router.replace('/focus/result');
  }, [completion.status, router]);

  const confirmTrialCancel = (sessionId: string): void => {
    if (cancelOperation.current !== null) return;
    setCancelBusy(true);
    setCancelError(null);
    const pending = cancelOnboardingTrial(sessionId).then(async (result) => {
      if (result.ok) {
        router.replace('/(onboarding)');
        return;
      }
      if (
        result.error.kind === 'cancel_onboarding_trial_error' &&
        result.error.code === 'SESSION_DEADLINE_REACHED'
      ) {
        setCancelError('Phiên đã tới deadline và không thể hủy. Đang chờ xác nhận kết quả.');
        await refreshTrial();
        return;
      }
      setCancelError('Chưa thể dừng. Phiên vẫn đang chạy và dữ liệu của bạn vẫn an toàn.');
    }).finally(() => {
      if (cancelOperation.current === pending) cancelOperation.current = null;
      setCancelBusy(false);
    });
    cancelOperation.current = pending;
  };

  if (trial.status === 'idle' || trial.status === 'loading') {
    return (
      <ScreenShell>
        <LoadingState label="Đang mở phiên dùng thử…" />
      </ScreenShell>
    );
  }

  if (trial.status === 'error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Dữ liệu phiên vẫn an toàn. Hãy thử lại để mở đúng phiên đang chạy."
          onRetry={() => void refreshTrial()}
          title="Chưa thể đọc phiên"
        />
      </ScreenShell>
    );
  }

  if (completion.status === 'error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Không có phần thưởng nào được ghi một phần. Hãy thử lại để hoàn tất phiên an toàn."
          onRetry={() => void retryCompletion()}
          title="Chưa thể hoàn tất phiên"
        />
      </ScreenShell>
    );
  }

  if (trial.status === 'ready') {
    return (
      <PetRouteVisibility>
        <OnboardingTrialRunningScreen
          cancelBusy={cancelBusy}
          cancelError={cancelError}
          cancelRequestToken={cancelRequestToken}
          onConfirmCancel={() => confirmTrialCancel(trial.sessionId)}
          onDismissPetFeedbackError={dismissPetFeedbackError}
          onRetryPet={() => void refreshPet()}
          pet={pet}
          projection={trial}
        />
      </PetRouteVisibility>
    );
  }

  return (
    <PetRouteVisibility>
      <FocusSessionScreen
        cancelRequestToken={cancelRequestToken}
        onMissingSession={() => router.replace('/(tabs)')}
        onDismissPetFeedbackError={dismissPetFeedbackError}
        onRetryPet={() => void refreshPet()}
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
