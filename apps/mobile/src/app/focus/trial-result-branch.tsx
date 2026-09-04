import { useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { OnboardingTrialResultScreen } from '@/presentation/features/onboarding-trial';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import {
  useDiscardPetTerminalFeedback, useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh, usePetVisualProjection, useOnboardingTrialResultProjection,
  useOnboardingTrialResultRefresh, useOnboardingTrialHandoffProjection, useCompleteFirstUseHandoff,
  useRetryOnboardingTrialPetFeedback,
} from '@/presentation/providers/mobile-application-context';
import { PetRouteVisibility } from '../pet-route-visibility';

export const TrialResultBranch = () => {
  const router = useRouter();
  const result = useOnboardingTrialResultProjection();
  const refresh = useOnboardingTrialResultRefresh();
  const handoff = useOnboardingTrialHandoffProjection();
  const complete = useCompleteFirstUseHandoff();
  const retryPet = useRetryOnboardingTrialPetFeedback();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const discard = useDiscardPetTerminalFeedback();
  const dismiss = useDismissPetTerminalFeedbackError();
  useEffect(() => discard, [discard]);
  useFocusEffect(useCallback(() => { void refresh(); void refreshPet(); }, [refresh, refreshPet]));
  if (result.status === 'idle' || result.status === 'loading') {
    return <ScreenShell><LoadingState label="Đang đọc kết quả đã ghi nhận…" /></ScreenShell>;
  }
  if (result.status !== 'ready') {
    return <ScreenShell><ErrorState title="Chưa thể đọc kết quả"
      body="Không có kết quả phù hợp. PixelDoro không dùng dữ liệu mô phỏng thay thế."
      onRetry={() => void refresh()} /></ScreenShell>;
  }
  return <PetRouteVisibility><OnboardingTrialResultScreen result={result.result} pet={pet}
    continueBusy={handoff.status === 'submitting'} continueError={handoff.status === 'error'}
    onContinue={() => { void complete(result.result).then((value) => { if (value.ok) router.replace('/(tabs)'); }); }}
    onDismissPetFeedbackError={dismiss} onRetryPet={() => void retryPet()}
  /></PetRouteVisibility>;
};
