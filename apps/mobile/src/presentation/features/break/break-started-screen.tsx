import type { PetVisualProjection, RunningBreakProjection } from '@pixeldoro/application';
import { StyleSheet, Text } from 'react-native';

import {
  InlineNotice,
  Panel,
  PetVisualStatus,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

export interface BreakStartedScreenProps {
  readonly session: RunningBreakProjection;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
}

export const BreakStartedScreen = ({
  session,
  pet,
  onDismissPetFeedbackError,
  onRetryPet,
}: BreakStartedScreenProps) => {
  const kindLabel = session.kind === 'long' ? 'Nghỉ dài' : 'Nghỉ ngắn';
  const displayLabel = `${kindLabel} · ${session.durationMinutes} phút`;
  return <ScreenShell>
    <ScreenHeader
      description={`${kindLabel} ${session.durationMinutes} phút đã được lưu an toàn trên thiết bị.`}
      eyebrow={session.kind === 'long' ? 'LONG BREAK · RUNNING' : 'SHORT BREAK · RUNNING'}
      title="Phiên nghỉ đã bắt đầu."
    />
    <PetVisualStatus
      onDismissTerminalError={onDismissPetFeedbackError}
      onRetryBase={onRetryPet}
      projection={pet}
    />
    <Panel tone={session.kind === 'long' ? 'gold' : 'strong'}>
      <Text accessibilityRole="header" style={styles.title}>
        {displayLabel}
      </Text>
      <Text style={styles.body}>
        Mèo Dev đang nghỉ cùng bạn. Không có XP hoặc Coin được tạo từ phiên nghỉ này.
      </Text>
    </Panel>
    <InlineNotice>
      Countdown theo timestamp, background/relaunch và tự hoàn tất sẽ được nối ở US-07-03.
    </InlineNotice>
  </ScreenShell>;
};

const styles = StyleSheet.create({
  title: { color: palette.textPrimary, fontSize: 22, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 22 },
});
