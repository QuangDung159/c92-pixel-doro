import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import type { StandardFocusSessionProjection } from '@/application';
import {
  InlineNotice,
  PetVisualStatus,
  PixelPanel,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

type ReadyProjection = Extract<StandardFocusSessionProjection, { readonly status: 'ready' }>;

const modeLabels = { relax: 'RELAX', strict: 'STRICT' } as const;
const tagLabels = {
  coding: 'Lập trình', study: 'Học tập', writing: 'Viết', reading: 'Đọc',
} as const;

export interface StandardFocusStartedScreenProps {
  readonly projection: ReadyProjection;
  readonly pet: PetVisualProjection;
  readonly onRetryPet: () => void;
  readonly onDismissPetFeedbackError: () => void;
}

export const StandardFocusStartedScreen = ({
  projection,
  pet,
  onRetryPet,
  onDismissPetFeedbackError,
}: StandardFocusStartedScreenProps) => (
  <ScreenShell>
    <ScreenHeader
      description="Phiên đã được lưu an toàn trên thiết bị."
      eyebrow="FOCUS SESSION"
      title="Đã bắt đầu tập trung"
    />
    <PixelPanel tone="strong">
      <View style={styles.summaryRow}>
        <Text style={styles.mode}>{modeLabels[projection.mode]}</Text>
        <Text style={styles.tag}>{tagLabels[projection.workTag]}</Text>
      </View>
      <Text accessibilityLabel={`${projection.durationMinutes} phút`} style={styles.duration}>
        {projection.durationMinutes}
      </Text>
      <Text style={styles.unit}>PHÚT ĐÃ CẤU HÌNH</Text>
    </PixelPanel>
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <InlineNotice>
      Phiên đang chạy từ dữ liệu đã lưu. Đồng hồ đếm ngược và thao tác dừng sẽ được mở ở bước tiếp theo.
    </InlineNotice>
  </ScreenShell>
);

const styles = StyleSheet.create({
  duration: { color: palette.textPrimary, fontSize: 72, fontWeight: '900', textAlign: 'center' },
  mode: { color: palette.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tag: { color: palette.accentDark, fontSize: 13, fontWeight: '900' },
  unit: { color: palette.textSecondary, fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
});
