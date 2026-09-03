import { useState } from 'react';
import type { PetVisualProjection } from '@pixeldoro/application';
import type { StandardFocusSessionProjection } from '@/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ConfirmationModal,
  CountdownDisplay,
  InlineNotice,
  PetVisualStatus,
  PixelPanel,
  ScreenHeader,
  ScreenShell,
  SecondaryButton,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

type RunningProjection = Extract<
  StandardFocusSessionProjection,
  { readonly status: 'ready' }
>;

const tagLabels = {
  coding: 'Lập trình', study: 'Học tập', writing: 'Viết', reading: 'Đọc',
} as const;

export interface StandardFocusRunningScreenProps {
  readonly projection: RunningProjection;
  readonly pet: PetVisualProjection;
  readonly cancelBusy: boolean;
  readonly cancelError: string | null;
  readonly cancelRequestToken?: number;
  readonly onConfirmCancel: () => void;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly reviewResetAvailable?: boolean;
  readonly reviewResetBusy?: boolean;
  readonly reviewResetError?: boolean;
  readonly onResetReviewData?: () => void;
}

export const StandardFocusRunningScreen = ({
  projection, pet, cancelBusy, cancelError, cancelRequestToken = 0,
  onConfirmCancel, onDismissPetFeedbackError, onRetryPet,
  reviewResetAvailable = false, reviewResetBusy = false,
  reviewResetError = false, onResetReviewData,
}: StandardFocusRunningScreenProps) => {
  const [showCancel, setShowCancel] = useState(false);
  const [dismissedCancelToken, setDismissedCancelToken] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const pending = projection.phase === 'deadline_pending';
  const strict = projection.mode === 'strict';
  const cancelVisible = !pending && (showCancel || cancelRequestToken > dismissedCancelToken);
  return (
    <ScreenShell>
      <ScreenHeader
        description={strict
          ? 'Strict có grace 10 giây khi bạn khóa màn hình hoặc chuyển app.'
          : 'Relax tiếp tục theo đồng hồ kể cả khi bạn khóa màn hình hoặc chuyển app.'}
        eyebrow={`${projection.mode.toUpperCase()} · ${projection.durationMinutes} PHÚT`}
        title={pending ? 'Đang chờ xác nhận kết quả.' : 'Đang tập trung.'}
      />
      <View style={styles.sessionRow}>
        <Text style={styles.mode}>{projection.mode.toUpperCase()}</Text>
        <Text style={styles.tag}>{tagLabels[projection.workTag]}</Text>
      </View>
      <CountdownDisplay
        displaySeconds={projection.displaySeconds}
        pending={pending}
        runningCaption="GIỮ NHỊP CÙNG MÈO DEV."
      />
      <PetVisualStatus
        onDismissTerminalError={onDismissPetFeedbackError}
        onRetryBase={onRetryPet}
        projection={pet}
      />
      <InlineNotice>
        {pending
          ? 'Phiên đã tới deadline. Chưa có trạng thái hoàn thành hoặc phần thưởng nào được ghi.'
          : strict
            ? 'Rời PixelDoro quá 10 giây trước deadline sẽ kết thúc phiên Strict mà không có phần thưởng.'
            : 'Thời gian hiển thị được tính từ phiên đã lưu, không phụ thuộc số nhịp tick trên màn hình.'}
      </InlineNotice>
      {cancelError === null ? null : <InlineNotice>{cancelError}</InlineNotice>}
      <SecondaryButton
        disabled={pending}
        label={pending ? 'Đang chờ xác nhận…' : 'Dừng phiên'}
        onPress={() => setShowCancel(true)}
      />
      {reviewResetAvailable && onResetReviewData !== undefined ? (
        <PixelPanel>
          <Text style={styles.reviewTitle}>Development Build · công cụ kiểm thử</Text>
          {reviewResetError ? (
            <Text accessibilityRole="alert" style={styles.reviewError}>Chưa thể reset dữ liệu test.</Text>
          ) : null}
          <SecondaryButton
            busy={reviewResetBusy}
            label={reviewResetBusy ? 'Đang reset…' : 'Reset dữ liệu test'}
            onPress={() => setShowReset(true)}
          />
        </PixelPanel>
      ) : null}
      <ConfirmationModal
        body="Phiên sẽ kết thúc và không nhận XP hoặc Coin."
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
      <ConfirmationModal
        body="Toàn bộ session, tiến trình và dữ liệu local trên Development Build này sẽ bị xóa."
        busy={reviewResetBusy}
        confirmLabel="Xóa dữ liệu test"
        onConfirm={() => { setShowReset(false); onResetReviewData?.(); }}
        onDismiss={() => setShowReset(false)}
        title="Reset dữ liệu kiểm thử?"
        visible={showReset}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mode: { color: palette.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  tag: { color: palette.accentDark, fontSize: 13, fontWeight: '900' },
  reviewTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: '900' },
  reviewError: { color: palette.accentRed, fontSize: 13, fontWeight: '800' },
});
