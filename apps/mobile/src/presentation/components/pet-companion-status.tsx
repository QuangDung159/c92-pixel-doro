import type { PetCompanionProjection } from '@pixeldoro/application';

import { PetStage } from './pet-stage';
import { ErrorState, LoadingState } from './status-surface';

export interface PetCompanionStatusProps {
  readonly projection: PetCompanionProjection;
  readonly onRetry: () => void;
}

export const PetCompanionStatus = ({
  projection,
  onRetry,
}: PetCompanionStatusProps) => {
  if (projection.status === 'loading') {
    return <LoadingState label="Đang đọc trạng thái người bạn…" />;
  }

  if (projection.status === 'recovery') {
    return (
      <ErrorState
        body="Tiến trình của bạn vẫn được giữ nguyên. Hãy thử đọc lại trạng thái đã lưu."
        onRetry={onRetry}
        title="Chưa thể xác định trạng thái người bạn"
      />
    );
  }

  return <PetStage state={projection.baseState} />;
};
