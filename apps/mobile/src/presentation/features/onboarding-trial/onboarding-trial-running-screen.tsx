import { useState } from 'react';
import type { PetVisualProjection } from '@pixeldoro/application';
import type { OnboardingTrialRunningProjection } from '@/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ConfirmationModal,
  InlineNotice,
  PetVisualStatus,
  ScreenHeader,
  ScreenShell,
  SecondaryButton,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

import { TrialCountdown } from './trial-countdown';

type ReadyTrialProjection = Extract<OnboardingTrialRunningProjection, { status: 'ready' }>;

export interface OnboardingTrialRunningScreenProps {
  readonly projection: ReadyTrialProjection;
  readonly pet: PetVisualProjection;
  readonly cancelBusy: boolean;
  readonly cancelError: string | null;
  readonly cancelRequestToken?: number;
  readonly onConfirmCancel: () => void;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
}

export const OnboardingTrialRunningScreen = ({
  projection,
  pet,
  cancelBusy,
  cancelError,
  cancelRequestToken = 0,
  onConfirmCancel,
  onDismissPetFeedbackError,
  onRetryPet,
}: OnboardingTrialRunningScreenProps) => {
  const [showCancel, setShowCancel] = useState(false);
  const [dismissedCancelToken, setDismissedCancelToken] = useState(0);
  const pending = projection.phase === 'deadline_pending';
  const cancelVisible = !pending && (showCancel || cancelRequestToken > dismissedCancelToken);

  return (
    <ScreenShell>
      <ScreenHeader
        description="Mèo Dev đang làm việc cùng bạn. Bạn có thể khóa màn hình hoặc chuyển app."
        eyebrow="TRIAL · RELAX · 5 PHÚT"
        title={pending ? 'Đang chốt phiên của bạn.' : 'Cùng tập trung nhé.'}
      />
      <View style={styles.sessionTopRow}>
        <Text style={styles.sessionMode}>ONBOARDING TRIAL · RELAX</Text>
        <Text style={styles.truthLabel}>THỜI GIAN THỰC</Text>
      </View>
      <TrialCountdown displaySeconds={projection.displaySeconds} pending={pending} />
      <PetVisualStatus
        onDismissTerminalError={onDismissPetFeedbackError}
        onRetryBase={onRetryPet}
        projection={pet}
      />
      <InlineNotice>
        {pending
          ? 'Phiên đã tới deadline. PixelDoro đang chờ bước xác nhận kết quả an toàn.'
          : 'Relax: thời gian tiếp tục theo đồng hồ kể cả khi bạn khóa màn hình hoặc chuyển app.'}
      </InlineNotice>
      {cancelError === null ? null : <InlineNotice>{cancelError}</InlineNotice>}
      <SecondaryButton
        disabled={pending}
        label={pending ? 'Đang xác nhận kết quả…' : 'Dừng phiên'}
        onPress={() => setShowCancel(true)}
      />
      <ConfirmationModal
        body="Phiên này sẽ kết thúc và không nhận XP hoặc Coin. Tiến trình trước đó vẫn an toàn."
        busy={cancelBusy}
        confirmLabel="Dừng phiên"
        onConfirm={onConfirmCancel}
        onDismiss={() => {
          if (cancelBusy) return;
          setShowCancel(false);
          setDismissedCancelToken(cancelRequestToken);
        }}
        title="Dừng phiên tập trung?"
        visible={cancelVisible}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  sessionTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  sessionMode: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  truthLabel: {
    color: palette.accentBlue,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
