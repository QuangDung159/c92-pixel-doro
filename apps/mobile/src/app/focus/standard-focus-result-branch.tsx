import { useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert } from 'react-native';
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
import {
  useBreakRecommendationActions,
  useBreakRecommendationProjection,
  useBreakRecommendationReviewStartAvailable,
} from '@/presentation/providers/break-hooks';
import { PetRouteVisibility } from '../pet-route-visibility';

export const StandardFocusResultBranch = ({ sessionId }: { readonly sessionId: string }) => {
  const router = useRouter();
  const result = useStandardFocusResultProjection();
  const breakRecommendation = useBreakRecommendationProjection();
  const reviewStartAvailable = useBreakRecommendationReviewStartAvailable();
  const {
    refresh: refreshBreakRecommendation,
    reset: resetBreakRecommendation,
  } = useBreakRecommendationActions();
  const refresh = useStandardFocusResultRefresh();
  const { consume, requestFeedback } = useStandardFocusOutcomeActions();
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
    if (result.status !== 'ready' || result.result.sessionId !== sessionId) return;
    requestFeedback();
    consume(sessionId);
  }, [result, sessionId, consume, requestFeedback]);
  useEffect(() => {
    if (
      result.status === 'ready' &&
      result.result.sessionId === sessionId &&
      result.result.status === 'completed'
    ) {
      void refreshBreakRecommendation(sessionId);
      return () => resetBreakRecommendation();
    }
    resetBreakRecommendation();
    return undefined;
  }, [result, sessionId, refreshBreakRecommendation, resetBreakRecommendation]);
  if (result.status === 'error' || result.status === 'missing') {
    return <ScreenShell><ErrorState title="Chưa thể đọc kết quả"
      body="Không thể xác nhận kết quả của phiên này. Thử đọc lại không cấp thêm phần thưởng."
      onRetry={() => void refresh(sessionId)} /></ScreenShell>;
  }
  if (result.status !== 'ready' || result.result.sessionId !== sessionId) {
    return <ScreenShell><LoadingState label="Đang đọc kết quả đã lưu…" /></ScreenShell>;
  }
  const currentBreakRecommendation =
    breakRecommendation.status !== 'idle' &&
    breakRecommendation.sourceSessionId === sessionId
      ? breakRecommendation
      : { status: 'loading' as const, sourceSessionId: sessionId };
  return <PetRouteVisibility>
    <StandardFocusResultScreen result={result.result} pet={pet}
      breakRecommendation={currentBreakRecommendation}
      onDismissPetFeedbackError={dismiss} onRetryPet={() => void refreshPet()}
      onRetryBreakRecommendation={() => void refreshBreakRecommendation(sessionId)}
      onHome={() => router.replace('/(tabs)')}
      {...(reviewStartAvailable ? {
        onReviewStartBreak: () => Alert.alert(
          'Review CTA',
          'CTA đã nhận thao tác và không tạo Break trong US-07-01.',
        ),
      } : {})}
      {...(review.available ? { onReviewReload: () => { discard(); void refresh(sessionId); } } : {})}
    />
  </PetRouteVisibility>;
};
