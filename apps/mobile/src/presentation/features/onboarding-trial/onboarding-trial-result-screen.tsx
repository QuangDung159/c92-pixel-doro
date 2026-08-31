import type {
  OnboardingTrialCommittedResult,
  PetVisualProjection,
} from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  InlineNotice,
  PetVisualStatus,
  PrimaryButton,
  RewardSummary,
  ScreenHeader,
  ScreenShell,
  StatDisplay,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

export interface OnboardingTrialResultScreenProps {
  readonly result: OnboardingTrialCommittedResult;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
}

export const OnboardingTrialResultScreen = ({
  result,
  pet,
  onDismissPetFeedbackError,
  onRetryPet,
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
    <View accessible accessibilityLabel={`Tổng hiện tại: ${result.totalXp} XP và ${result.coinBalance} Coin`} style={styles.totals}>
      <Text style={styles.totalTitle}>Tiến trình hiện tại</Text>
      <View style={styles.totalRow}>
        <StatDisplay label="Tổng XP" value={`${result.totalXp}`} />
        <StatDisplay label="Coin hiện có" value={`${result.coinBalance}`} />
      </View>
    </View>
    <InlineNotice>Mèo Dev đang ở trạng thái cơ bản. Phần chúc mừng và Pet Room sẽ mở ở bước tiếp theo.</InlineNotice>
    <PrimaryButton disabled label="Tiếp tục" onPress={() => undefined} />
  </ScreenShell>
);

const styles = StyleSheet.create({
  totals: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    gap: 10,
    padding: 18,
  },
  totalTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: '900' },
  totalRow: { flexDirection: 'row', gap: 10 },
});
