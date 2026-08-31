import type { PetVisualProjection } from '@pixeldoro/application';

import { PetStage } from './pet-stage';
import { ErrorState, LoadingState } from './status-surface';
import { usePetVisualPlaybackCallbacks } from '@/presentation/providers/mobile-application-context';

export interface PetVisualStatusProps {
  readonly projection: PetVisualProjection;
  readonly onRetryBase: () => void;
  readonly onDismissTerminalError: () => void;
}

export const PetVisualStatus = ({
  projection,
  onRetryBase,
  onDismissTerminalError,
}: PetVisualStatusProps) => {
  const playbackCallbacks = usePetVisualPlaybackCallbacks();
  if (projection.status === 'loading') {
    return <LoadingState label="Đang đồng bộ người bạn nhỏ…" />;
  }
  if (projection.status === 'recovery') {
    const terminalRecovery = projection.source !== 'base';
    return (
      <ErrorState
        body={terminalRecovery
          ? 'Kết quả phiên vẫn an toàn. Phản hồi Pet chưa thể xác định từ committed truth.'
          : 'Dữ liệu phiên chưa thể đọc an toàn. Pet sẽ không đoán trạng thái.'}
        onRetry={terminalRecovery ? onDismissTerminalError : onRetryBase}
        title={terminalRecovery
          ? 'Chưa thể hiển thị phản hồi Pet'
          : 'Chưa thể đồng bộ Pet'}
      />
    );
  }

  return (
    <PetStage
      {...(projection.source === 'terminal'
        ? { liveRegion: 'polite' as const }
        : {})}
      playbackId={projection.announcementId}
      state={projection.state}
      visualMode={projection.visualMode}
      {...(projection.source === 'terminal'
        ? {
            onPlaybackComplete: () =>
              playbackCallbacks.reportComplete(projection.feedbackId),
            onPlaybackFailure: () =>
              playbackCallbacks.reportFailure(projection.feedbackId),
          }
        : {})}
    />
  );
};
