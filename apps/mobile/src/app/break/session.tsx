import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import { BreakStartedScreen } from '@/presentation/features/break/break-started-screen';
import {
  useBreakCancelActions,
  useBreakCancelProjection,
  useBreakSessionActions,
  useBreakSessionProjection,
} from '@/presentation/providers/break-hooks';
import {
  useAppVisibility,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';
import { useSessionCancelBack } from '../use-session-cancel-back';

export default function BreakSessionRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ readonly sessionId?: string | string[] }>();
  const projection = useBreakSessionProjection();
  const cancelProjection = useBreakCancelProjection();
  const { cancel, reset: resetCancel } = useBreakCancelActions();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const { activate, deactivate, refresh, reset } = useBreakSessionActions();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const appVisibility = useAppVisibility();
  const validSessionId = typeof sessionId === 'string' && sessionId.trim() ? sessionId : null;

  useFocusEffect(useCallback(() => {
    if (validSessionId !== null) {
      activate(validSessionId);
      void refreshPet();
    }
    return () => {
      deactivate();
      reset();
      resetCancel();
    };
  }, [activate, deactivate, refreshPet, reset, resetCancel, validSessionId]));

  useSessionCancelBack(() => {
    if (projection.status === 'ready' && projection.phase === 'running') {
      setCancelRequestToken((token) => token + 1);
    } else if (projection.status === 'ready' &&
      (projection.phase === 'completed' || projection.phase === 'cancelled')) {
      router.replace('/(tabs)');
    }
  });

  if (validSessionId === null) {
    return <ScreenShell><ErrorState
      title="Chưa thể mở phiên nghỉ"
      body="Định danh phiên nghỉ không hợp lệ. PixelDoro sẽ không dùng một phiên khác thay thế."
      onRetry={() => router.replace('/(tabs)')}
    /></ScreenShell>;
  }
  if (projection.status === 'error') {
    return <ScreenShell><ErrorState
      title="Chưa thể đọc phiên nghỉ"
      body="Phiên đã lưu vẫn an toàn. Hãy thử đọc lại đúng phiên này."
      onRetry={() => void refresh(validSessionId)}
    /></ScreenShell>;
  }
  if (projection.status !== 'ready' || projection.session.sessionId !== validSessionId) {
    return <ScreenShell><LoadingState label="Đang mở phiên nghỉ đã lưu…" /></ScreenShell>;
  }
  return <PetRouteVisibility>
    <BreakStartedScreen
      appVisible={appVisibility === 'active'}
      cancelBusy={cancelProjection.status === 'submitting'}
      cancelError={cancelProjection.status !== 'error' ? null
        : cancelProjection.code === 'STATE_INVALID'
          ? 'Phiên đã có kết quả khác hoặc dữ liệu không còn phù hợp. Hãy đọc lại phiên đã lưu.'
          : 'Chưa thể dừng. Phiên vẫn an toàn; bạn có thể thử lại.'}
      cancelRequestToken={cancelRequestToken}
      key={`${validSessionId}:${cancelProjection.status === 'submitting'
        ? 'busy' : appVisibility}`}
      onConfirmCancel={() => { void cancel(validSessionId); }}
      projection={projection}
      pet={pet}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onHome={() => router.replace('/(tabs)')}
      onRetryPet={() => void refreshPet()}
    />
  </PetRouteVisibility>;
}
