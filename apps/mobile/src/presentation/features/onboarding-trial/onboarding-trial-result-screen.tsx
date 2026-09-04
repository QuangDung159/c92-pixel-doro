import type {
  OnboardingTrialCommittedResult,
  PetVisualProjection,
} from '@pixeldoro/application';

import {
  InlineNotice,
  PetVisualStatus,
  PrimaryButton,
  RewardSummary,
  ScreenHeader,
  ScreenShell,
  ProgressionSummary,
} from '@/presentation/components';

export interface OnboardingTrialResultScreenProps {
  readonly result: OnboardingTrialCommittedResult;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly onContinue: () => void;
  readonly continueBusy: boolean;
  readonly continueError: boolean;
}

export const OnboardingTrialResultScreen = ({
  result,
  pet,
  onDismissPetFeedbackError,
  onRetryPet,
  onContinue,
  continueBusy,
  continueError,
}: OnboardingTrialResultScreenProps) => (
  <ScreenShell>
    <ScreenHeader
      description="5 phút tập trung đã được ghi nhận thành tiến trình thật của bạn."
      eyebrow="TRIAL COMPLETE"
      title="Bạn đã mở khóa nhịp đầu tiên."
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <RewardSummary coinsEarned={result.coinsEarned} xpEarned={result.xpEarned} />
    <ProgressionSummary totalXp={result.totalXp} coinBalance={result.coinBalance} />
    <InlineNotice>
      {continueError
        ? 'Kết quả và phần thưởng vẫn an toàn. Hãy thử mở Pet Room lại.'
        : 'Mèo Dev đã ghi nhận nỗ lực đầu tiên. Bạn có thể vào Pet Room ngay.'}
    </InlineNotice>
    <PrimaryButton
      busy={continueBusy}
      label={continueBusy ? 'Đang mở Pet Room…' : 'Vào Pet Room'}
      onPress={onContinue}
    />
  </ScreenShell>
);
