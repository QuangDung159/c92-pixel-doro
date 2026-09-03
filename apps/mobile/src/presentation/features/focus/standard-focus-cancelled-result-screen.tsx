import type { PetVisualProjection, StandardFocusTerminalResult } from '@pixeldoro/application';
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
  readonly result: StandardFocusTerminalResult;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly onHome: () => void;
}

export const StandardFocusCancelledResultScreen = ({
  result, pet, onDismissPetFeedbackError, onRetryPet, onHome,
}: StandardFocusCancelledResultScreenProps) => {
  const failed = result.status === 'failed';
  return (
  <ScreenShell>
    <ScreenHeader
      description={failed
        ? 'Phiên Strict đã vượt quá thời gian grace và được ghi nhận an toàn.'
        : 'Phiên đã được dừng và ghi nhận an toàn trên thiết bị.'}
      eyebrow={failed ? 'FOCUS · STRICT · FAILED' : 'FOCUS · CANCELLED'}
      title={failed ? 'Phiên Strict đã kết thúc.' : 'Phiên đã dừng.'}
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <View
      accessible
      accessibilityLabel={failed
        ? 'Phiên Strict thất bại, không có phần thưởng'
        : 'Phiên đã dừng, không có phần thưởng'}
      style={styles.summary}
    >
      <Text style={styles.title}>{result.mode.toUpperCase()} · {tagLabels[result.workTag]}</Text>
      <View style={styles.row}>
        <StatDisplay label="XP nhận" value="0" />
        <StatDisplay label="Coin nhận" value="0" />
      </View>
    </View>
    <InlineNotice>
      {failed
        ? 'Bạn đã rời PixelDoro quá 10 giây trước deadline. Phiên không nhận phần thưởng và không mở Break.'
        : 'Phiên bị hủy không nhận phần thưởng và không mở Break. Không có dữ liệu hoàn thành giả được tạo.'}
    </InlineNotice>
    <PrimaryButton label="Về Home" onPress={onHome} />
  </ScreenShell>
  );
};

const styles = StyleSheet.create({
  summary: {
    backgroundColor: palette.white, borderColor: palette.border, borderRadius: 8,
    borderWidth: 3, gap: 12, padding: 18,
  },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10 },
});
