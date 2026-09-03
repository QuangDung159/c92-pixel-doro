import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { OnboardingTrialRunningScreen } from '@/presentation/features/onboarding-trial';
import { decideFocusSessionBranch } from '@/presentation/features/focus/focus-session-arbitration';
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
import {
  useStandardFocusSessionActions,
  useStandardFocusSessionProjection,
  useStandardFocusOutcomeProjection,
} from '@/presentation/providers/standard-focus-hooks';
import { useSessionCancelBack } from '../use-session-cancel-back';
import { PetRouteVisibility } from '../pet-route-visibility';
import { PrototypeSessionBranch } from './prototype-session-branch';
import { StandardFocusStartedBranch } from './standard-focus-started-branch';

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
  const standardFocus = useStandardFocusSessionProjection();
  const standardOutcome = useStandardFocusOutcomeProjection();
  const {
    activate: activateStandardFocus,
    deactivate: deactivateStandardFocus,
    refresh: refreshStandardFocus,
  } = useStandardFocusSessionActions();
  const { retry: retryCompletion } = useOnboardingTrialCompletionActions();
  const {
    activate: activateTrial,
    deactivate: deactivateTrial,
    refresh: refreshTrial,
  } = useOnboardingTrialRunningActions();
  useFocusEffect(
    useCallback(() => {
      activateTrial();
      activateStandardFocus();
      void Promise.all([refreshPet(), refreshStandardFocus()]);
      return () => {
        deactivateTrial();
        deactivateStandardFocus();
      };
    }, [
      activateStandardFocus, activateTrial, deactivateStandardFocus,
      deactivateTrial, refreshPet, refreshStandardFocus,
    ]),
  );

  useSessionCancelBack(() => setCancelRequestToken((token) => token + 1));
  const branch = decideFocusSessionBranch(trial, standardFocus);

  useEffect(() => {
    if (completion.status === 'committed') router.replace('/focus/result');
  }, [completion.status, router]);

  useEffect(() => {
    if (standardOutcome.status === 'failed') {
      router.replace({
        pathname: '/focus/result',
        params: { sessionId: standardOutcome.sessionId },
      });
    }
  }, [router, standardOutcome]);

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

  if (branch === 'loading') {
    return (
      <ScreenShell>
        <LoadingState label="Đang mở phiên dùng thử…" />
      </ScreenShell>
    );
  }

  if (branch === 'trial_error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Dữ liệu phiên vẫn an toàn. Hãy thử lại để mở đúng phiên đang chạy."
          onRetry={() => void Promise.all([refreshTrial(), refreshStandardFocus()])}
          title="Chưa thể đọc phiên"
        />
      </ScreenShell>
    );
  }

  if (branch === 'trial' && completion.status === 'error') {
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

  if (branch === 'trial' && trial.status === 'ready') {
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

  if (branch === 'standard_error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Phiên đã lưu vẫn an toàn. Hãy thử lại để đọc đúng dữ liệu trên thiết bị."
          onRetry={() => void refreshStandardFocus()}
          title="Chưa thể mở phiên tập trung"
        />
      </ScreenShell>
    );
  }

  if (branch === 'standard' && standardFocus.status === 'ready') {
    return (
      <StandardFocusStartedBranch
        cancelRequestToken={cancelRequestToken}
        onDismissPetFeedbackError={dismissPetFeedbackError}
        onRetryPet={() => void refreshPet()}
        pet={pet}
        projection={standardFocus}
      />
    );
  }

  return (
    <PrototypeSessionBranch
      cancelRequestToken={cancelRequestToken}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onRetryPet={() => void refreshPet()}
      pet={pet}
    />
  );
}
