import type { PetVisualProjection, StandardFocusCancelledResult } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  InlineNotice,
  PetVisualStatus,
  PrimaryButton,
  ScreenHeader,
  ScreenShell,
  StatDisplay,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

const tagLabels = {
  coding: 'Lập trình', study: 'Học tập', writing: 'Viết', reading: 'Đọc',
} as const;

export interface StandardFocusCancelledResultScreenProps {
  readonly result: StandardFocusCancelledResult;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly onHome: () => void;
}

export const StandardFocusCancelledResultScreen = ({
  result, pet, onDismissPetFeedbackError, onRetryPet, onHome,
}: StandardFocusCancelledResultScreenProps) => (
  <ScreenShell>
    <ScreenHeader
      description="Phiên đã được dừng và ghi nhận an toàn trên thiết bị."
      eyebrow="FOCUS · CANCELLED"
      title="Phiên đã dừng."
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <View accessible accessibilityLabel="Phiên đã dừng, không có phần thưởng" style={styles.summary}>
      <Text style={styles.title}>RELAX · {tagLabels[result.workTag]}</Text>
      <View style={styles.row}>
        <StatDisplay label="XP nhận" value="0" />
        <StatDisplay label="Coin nhận" value="0" />
      </View>
    </View>
    <InlineNotice>
      Phiên bị hủy không nhận phần thưởng và không mở Break. Không có dữ liệu hoàn thành giả được tạo.
    </InlineNotice>
    <PrimaryButton label="Về Home" onPress={onHome} />
  </ScreenShell>
);

const styles = StyleSheet.create({
  summary: {
    backgroundColor: palette.white, borderColor: palette.border, borderRadius: 8,
    borderWidth: 3, gap: 12, padding: 18,
  },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10 },
});
