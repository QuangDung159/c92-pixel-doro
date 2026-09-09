import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text } from 'react-native';

import type { BreakSessionProjection } from '@/application';
import {
  CountdownDisplay,
  InlineNotice,
  Panel,
  PetVisualStatus,
  PrimaryButton,
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
}

export const BreakStartedScreen = ({
  projection,
  pet,
  onDismissPetFeedbackError,
  onHome,
  onRetryPet,
}: BreakStartedScreenProps) => {
  const { session } = projection;
  const kindLabel = session.kind === 'long' ? 'Nghỉ dài' : 'Nghỉ ngắn';
  const displayLabel = `${kindLabel} · ${session.durationMinutes} phút`;
  const completed = projection.phase === 'completed';
  return <ScreenShell>
    <ScreenHeader
      description={completed
        ? `${kindLabel} đã hoàn thành và được lưu an toàn trên thiết bị.`
        : `${kindLabel} đang tiếp tục theo thời điểm kết thúc đã lưu.`}
      eyebrow={completed
        ? `${session.kind === 'long' ? 'LONG' : 'SHORT'} BREAK · COMPLETED`
        : `${session.kind === 'long' ? 'LONG' : 'SHORT'} BREAK · RUNNING`}
      title={completed ? 'Phiên nghỉ đã hoàn thành.' : 'Đang nghỉ cùng Mèo Dev.'}
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <Panel tone={session.kind === 'long' ? 'gold' : 'strong'}>
      <Text accessibilityRole="header" style={styles.title}>{displayLabel}</Text>
      {!completed && <CountdownDisplay
        displaySeconds={projection.displaySeconds}
        pending={projection.phase === 'deadline_pending'}
        runningCaption="ĐANG NGHỈ…"
      />}
      <Text style={styles.body}>
        {completed
          ? 'Mèo Dev đã trở về trạng thái sẵn sàng. Phiên nghỉ không tạo XP hoặc Coin.'
          : 'Bạn có thể khóa màn hình hoặc rời app. Thời gian vẫn được tính từ timestamp đã lưu.'}
      </Text>
    </Panel>
    {completed
      ? <PrimaryButton label="Về Home" onPress={onHome} />
      : <InlineNotice>
          Phiên nghỉ không có Pause, Strict Mode hoặc phần thưởng.
        </InlineNotice>}
  </ScreenShell>;
};

const styles = StyleSheet.create({
  title: { color: palette.textPrimary, fontSize: 22, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 22 },
});
