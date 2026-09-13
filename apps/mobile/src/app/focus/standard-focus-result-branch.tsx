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
import {
  useBreakRecommendationActions,
  useBreakRecommendationProjection,
  useBreakStartActions,
  useBreakStartProjection,
} from '@/presentation/providers/break-hooks';
import { PetRouteVisibility } from '../pet-route-visibility';

export const StandardFocusResultBranch = ({ sessionId }: { readonly sessionId: string }) => {
  const router = useRouter();
  const result = useStandardFocusResultProjection();
  const breakRecommendation = useBreakRecommendationProjection();
  const breakStart = useBreakStartProjection();
  const {
    refresh: refreshBreakRecommendation,
    reset: resetBreakRecommendation,
  } = useBreakRecommendationActions();
  const { start: startBreak, reset: resetBreakStart } = useBreakStartActions();
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
  useEffect(() => () => resetBreakStart(), [resetBreakStart]);
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
  const currentBreakStart = breakStart.sourceSessionId === sessionId
    ? breakStart
    : { status: 'idle' as const, sourceSessionId: sessionId };
  const handleStartBreak = async (): Promise<void> => {
    const started = await startBreak(sessionId);
    if (!started.ok) return;
    router.replace({
      pathname: '/break/session',
      params: { sessionId: started.session.id },
    });
  };
  return <PetRouteVisibility>
    <StandardFocusResultScreen result={result.result} pet={pet}
      breakRecommendation={currentBreakRecommendation}
      breakStart={currentBreakStart}
      onDismissPetFeedbackError={dismiss} onRetryPet={() => void refreshPet()}
      onRetryBreakRecommendation={() => void refreshBreakRecommendation(sessionId)}
      onStartBreak={() => void handleStartBreak()}
      onHome={() => {
        if (result.result.status === 'completed') {
          router.replace({
            pathname: '/(tabs)',
            params: { reviewToken: result.result.receiptId },
          });
        } else {
          router.replace('/(tabs)');
        }
      }}
      {...(review.available ? { onReviewReload: () => { discard(); void refresh(sessionId); } } : {})}
    />
  </PetRouteVisibility>;
};
