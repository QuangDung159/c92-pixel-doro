import { useState } from 'react';
import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import type { StandardFocusSessionProjection } from '@/application';
import {
  InlineNotice,
  ConfirmationModal,
  PetVisualStatus,
  PixelPanel,
  ScreenHeader,
  ScreenShell,
  SecondaryButton,
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
  readonly reviewResetAvailable?: boolean;
  readonly reviewResetBusy?: boolean;
  readonly reviewResetError?: boolean;
  readonly onResetReviewData?: () => void;
}

export const StandardFocusStartedScreen = ({
  projection,
  pet,
  onRetryPet,
  onDismissPetFeedbackError,
  reviewResetAvailable = false,
  reviewResetBusy = false,
  reviewResetError = false,
  onResetReviewData,
}: StandardFocusStartedScreenProps) => {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
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
      {reviewResetAvailable && onResetReviewData !== undefined ? (
        <PixelPanel>
          <Text style={styles.reviewTitle}>Development Build · công cụ kiểm thử</Text>
          <Text style={styles.reviewCopy}>
            Xóa toàn bộ dữ liệu local để quay lại onboarding và kiểm thử một phiên mới.
          </Text>
          {reviewResetError ? (
            <Text accessibilityRole="alert" style={styles.reviewError}>
              Chưa thể reset dữ liệu test. Dữ liệu hiện tại vẫn được giữ nguyên.
            </Text>
          ) : null}
          <SecondaryButton
            busy={reviewResetBusy}
            label={reviewResetBusy ? 'Đang reset…' : 'Reset dữ liệu test'}
            onPress={() => setConfirmReset(true)}
          />
        </PixelPanel>
      ) : null}
      <ConfirmationModal
        body="Toàn bộ session, tiến trình và dữ liệu local trên Development Build này sẽ bị xóa."
        busy={reviewResetBusy}
        busyLabel="Đang reset…"
        confirmLabel="Xóa dữ liệu test"
        onConfirm={() => {
          setConfirmReset(false);
          onResetReviewData?.();
        }}
        onDismiss={() => setConfirmReset(false)}
        title="Reset dữ liệu kiểm thử?"
        visible={confirmReset}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  duration: { color: palette.textPrimary, fontSize: 72, fontWeight: '900', textAlign: 'center' },
  mode: { color: palette.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tag: { color: palette.accentDark, fontSize: 13, fontWeight: '900' },
  unit: { color: palette.textSecondary, fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  reviewCopy: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  reviewError: { color: palette.accentRed, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  reviewTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: '900' },
});
