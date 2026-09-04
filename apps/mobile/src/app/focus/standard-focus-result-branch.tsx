import { useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StandardFocusResultScreen } from '@/presentation/features/focus';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import {
  useDiscardPetTerminalFeedback, useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh, usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';
import {
  useStandardFocusResultProjection, useStandardFocusResultRefresh,
  useStandardFocusOutcomeActions, useStandardFocusReviewReset,
} from '@/presentation/providers/standard-focus-hooks';
import { PetRouteVisibility } from '../pet-route-visibility';

export const StandardFocusResultBranch = ({ sessionId }: { readonly sessionId: string }) => {
  const router = useRouter();
  const result = useStandardFocusResultProjection();
  const refresh = useStandardFocusResultRefresh();
  const { consume } = useStandardFocusOutcomeActions();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const discard = useDiscardPetTerminalFeedback();
  const dismiss = useDismissPetTerminalFeedbackError();
  const review = useStandardFocusReviewReset();
  useEffect(() => discard, [discard]);
  useFocusEffect(useCallback(() => {
    void refresh(sessionId);
    void refreshPet();
  }, [sessionId, refresh, refreshPet]));
  useEffect(() => {
    if (result.status === 'ready' && result.result.sessionId === sessionId) consume(sessionId);
  }, [result, sessionId, consume]);
  if (result.status === 'error' || result.status === 'missing') {
    return <ScreenShell><ErrorState title="Chưa thể đọc kết quả"
      body="Không thể xác nhận kết quả của phiên này. Thử đọc lại không cấp thêm phần thưởng."
      onRetry={() => void refresh(sessionId)} /></ScreenShell>;
  }
  if (result.status !== 'ready' || result.result.sessionId !== sessionId) {
    return <ScreenShell><LoadingState label="Đang đọc kết quả đã lưu…" /></ScreenShell>;
  }
  return <PetRouteVisibility>
    <StandardFocusResultScreen result={result.result} pet={pet}
      onDismissPetFeedbackError={dismiss} onRetryPet={() => void refreshPet()}
      onHome={() => router.replace('/(tabs)')}
      {...(review.available ? { onReviewReload: () => { discard(); void refresh(sessionId); } } : {})}
    />
  </PetRouteVisibility>;
};
