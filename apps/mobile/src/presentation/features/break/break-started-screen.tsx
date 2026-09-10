import type { PetVisualProjection } from '@pixeldoro/application';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { BreakSessionProjection } from '@/application';
import {
  CountdownDisplay,
  ConfirmationDialog,
  InlineNotice,
  Panel,
  PetVisualStatus,
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

type ReadyBreakProjection = Extract<BreakSessionProjection, { status: 'ready' }>;

export interface BreakStartedScreenProps {
  readonly projection: ReadyBreakProjection;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onHome: () => void;
  readonly onRetryPet: () => void;
  readonly appVisible: boolean;
  readonly cancelBusy: boolean;
  readonly cancelError: string | null;
  readonly cancelRequestToken?: number;
  readonly onConfirmCancel: () => void;
}

export const BreakStartedScreen = ({
  projection,
  pet,
  onDismissPetFeedbackError,
  onHome,
  onRetryPet,
  appVisible,
  cancelBusy,
  cancelError,
  cancelRequestToken = 0,
  onConfirmCancel,
}: BreakStartedScreenProps) => {
  const [showCancel, setShowCancel] = useState(false);
  const [dismissedCancelToken, setDismissedCancelToken] = useState(0);
  const { session } = projection;
  const kindLabel = session.kind === 'long' ? 'Nghỉ dài' : 'Nghỉ ngắn';
  const displayLabel = `${kindLabel} · ${session.durationMinutes} phút`;
  const running = projection.phase === 'running';
  const completed = projection.phase === 'completed';
  const terminal = completed || projection.phase === 'cancelled';
  const cancelVisible = running && appVisible &&
    (showCancel || cancelRequestToken > dismissedCancelToken);
  return <ScreenShell>
    <ScreenHeader
      description={terminal
        ? completed
          ? `${kindLabel} đã hoàn thành và được lưu an toàn trên thiết bị.`
          : `${kindLabel} đã được dừng và lưu an toàn trên thiết bị.`
        : `${kindLabel} đang tiếp tục theo thời điểm kết thúc đã lưu.`}
      eyebrow={terminal
        ? `${session.kind === 'long' ? 'LONG' : 'SHORT'} BREAK · ${completed ? 'COMPLETED' : 'CANCELLED'}`
        : `${session.kind === 'long' ? 'LONG' : 'SHORT'} BREAK · RUNNING`}
      title={completed ? 'Phiên nghỉ đã hoàn thành.'
        : projection.phase === 'cancelled' ? 'Phiên nghỉ đã dừng.'
          : projection.phase === 'deadline_pending' ? 'Đang xác nhận kết quả.'
            : 'Đang nghỉ cùng Mèo Dev.'}
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <Panel tone={session.kind === 'long' ? 'gold' : 'strong'}>
      <Text accessibilityRole="header" style={styles.title}>{displayLabel}</Text>
      {!terminal && <CountdownDisplay
        displaySeconds={projection.displaySeconds}
        pending={projection.phase === 'deadline_pending'}
        runningCaption="ĐANG NGHỈ…"
      />}
      <Text style={styles.body}>
        {terminal
          ? `Mèo Dev đã trở về trạng thái sẵn sàng. Phiên nghỉ ${completed
            ? 'hoàn thành' : 'bị dừng'} không tạo XP hoặc Coin.`
          : 'Bạn có thể khóa màn hình hoặc rời app. Thời gian vẫn được tính từ timestamp đã lưu.'}
      </Text>
    </Panel>
    {terminal
      ? <PrimaryButton label="Về Home" onPress={onHome} />
      : <>
        <InlineNotice>
          Phiên nghỉ không có Pause, Strict Mode hoặc phần thưởng.
        </InlineNotice>
        <SecondaryButton
          disabled={!running}
          label={running ? 'Dừng phiên' : 'Đang xác nhận…'}
          onPress={() => setShowCancel(true)}
        />
      </>}
    {cancelError === null ? null : <InlineNotice>{cancelError}</InlineNotice>}
    <ConfirmationDialog
      body="Phiên nghỉ sẽ kết thúc và không nhận XP hoặc Coin."
      busy={cancelBusy}
      busyLabel="Đang dừng phiên…"
      confirmLabel="Dừng phiên nghỉ"
      onConfirm={onConfirmCancel}
      onDismiss={() => {
        if (cancelBusy) return;
        setShowCancel(false);
        setDismissedCancelToken(cancelRequestToken);
      }}
      title="Dừng phiên nghỉ?"
      visible={cancelVisible}
    />
  </ScreenShell>;
};

const styles = StyleSheet.create({
  title: { color: palette.textPrimary, fontSize: 22, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 22 },
});
