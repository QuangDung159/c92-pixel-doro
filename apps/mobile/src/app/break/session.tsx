import { useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';
import { BreakStartedScreen } from '@/presentation/features/break/break-started-screen';
import {
  useBreakSessionActions,
  useBreakSessionProjection,
} from '@/presentation/providers/break-hooks';
import {
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function BreakSessionRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ readonly sessionId?: string | string[] }>();
  const projection = useBreakSessionProjection();
  const { activate, deactivate, refresh, reset } = useBreakSessionActions();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const validSessionId = typeof sessionId === 'string' && sessionId.trim() ? sessionId : null;

  useFocusEffect(useCallback(() => {
    if (validSessionId !== null) {
      activate(validSessionId);
      void refreshPet();
    }
    return () => {
      deactivate();
      reset();
    };
  }, [activate, deactivate, refreshPet, reset, validSessionId]));

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
      projection={projection}
      pet={pet}
      onDismissPetFeedbackError={dismissPetFeedbackError}
      onHome={() => router.replace('/(tabs)')}
      onRetryPet={() => void refreshPet()}
    />
  </PetRouteVisibility>;
}
