import type {
  PetCompanionProjection,
  PetTerminalFeedbackProjection,
} from '@pixeldoro/application';

import { PetCompanionStatus } from './pet-companion-status';
import { PetStage } from './pet-stage';
import { ErrorState } from './status-surface';

export interface PetTerminalFeedbackStatusProps {
  readonly baseProjection: PetCompanionProjection;
  readonly feedbackProjection: PetTerminalFeedbackProjection;
  readonly onRetryBase: () => void;
  readonly onDismissFeedbackError: () => void;
}

export const PetTerminalFeedbackStatus = ({
  baseProjection,
  feedbackProjection,
  onRetryBase,
  onDismissFeedbackError,
}: PetTerminalFeedbackStatusProps) => {
  if (feedbackProjection.status === 'recovery') {
    return (
      <ErrorState
        body="Kết quả phiên vẫn an toàn. Phản hồi hình ảnh chưa thể hiển thị đúng."
        onRetry={onDismissFeedbackError}
        title="Chưa thể phát phản hồi Pet"
      />
    );
  }

  if (feedbackProjection.status === 'active') {
    return <PetStage liveRegion="polite" state={feedbackProjection.state} />;
  }

  return (
    <PetCompanionStatus
      onRetry={onRetryBase}
      projection={baseProjection}
    />
  );
};
