import {
  STANDARD_FOCUS_DURATION_STEP_MINUTES,
  STANDARD_FOCUS_MAX_DURATION_MINUTES,
  STANDARD_FOCUS_MIN_DURATION_MINUTES,
  type FocusMode,
  type WorkTag,
} from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import type { StandardFocusSetupProjection } from '@/application';
import {
  ChoiceChip,
  DurationControl,
  InlineNotice,
  PixelPanel,
  PrimaryButton,
  ScreenHeader,
  ScreenShell,
  SecondaryButton,
  SectionLabel,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

const tagLabels: Record<WorkTag, string> = {
  coding: 'Lập trình', study: 'Học tập', writing: 'Viết', reading: 'Đọc',
};

const errorCopy = {
  INVALID_CONFIGURATION: 'Lựa chọn chưa hợp lệ. Hãy kiểm tra lại thời lượng, chế độ và công việc.',
  ACTIVE_SESSION: 'Bạn đã có một phiên đang chạy. Hãy mở lại phiên đó trước khi bắt đầu phiên mới.',
  START_UNAVAILABLE: 'Chưa thể bắt đầu lúc này. Lựa chọn của bạn vẫn được giữ để thử lại.',
  COMMITTED_HANDOFF_UNAVAILABLE: 'Phiên đã được lưu nhưng chưa thể mở. Hãy mở lại ứng dụng để vào đúng phiên.',
} as const;

export interface FocusSetupScreenProps {
  readonly projection: StandardFocusSetupProjection;
  readonly onSetDuration: (duration: number) => void;
  readonly onSetMode: (mode: FocusMode) => void;
  readonly onSetWorkTag: (tag: WorkTag) => void;
  readonly onStart: () => void;
  readonly onBack: () => void;
}

export const FocusSetupScreen = ({
  projection,
  onSetDuration,
  onSetMode,
  onSetWorkTag,
  onStart,
  onBack,
}: FocusSetupScreenProps) => {
  const { configuration, command } = projection;
  const busy = command.status === 'submitting';
  return (
    <ScreenShell>
      <ScreenHeader
        description="Chọn một phiên vừa đủ để bạn bắt đầu ngay."
        eyebrow="FOCUS SETUP"
        title="Mình sẽ làm gì tiếp?"
      />
      {command.status === 'error' ? (
        <InlineNotice>{errorCopy[command.error.code]}</InlineNotice>
      ) : null}
      <PixelPanel>
        <SectionLabel>Thời lượng</SectionLabel>
        <DurationControl
          disabled={busy}
          max={STANDARD_FOCUS_MAX_DURATION_MINUTES}
          min={STANDARD_FOCUS_MIN_DURATION_MINUTES}
          onChange={onSetDuration}
          quickValues={[15, 25, 50]}
          step={STANDARD_FOCUS_DURATION_STEP_MINUTES}
          value={configuration.durationMinutes}
        />
      </PixelPanel>
      <PixelPanel>
        <SectionLabel>Chế độ</SectionLabel>
        <View accessibilityRole="radiogroup" style={styles.choiceColumn}>
          <ChoiceChip disabled={busy} label="Relax · có thể rời app" onPress={() => onSetMode('relax')} selected={configuration.mode === 'relax'} />
          <ChoiceChip disabled={busy} label="Strict · grace 10 giây" onPress={() => onSetMode('strict')} selected={configuration.mode === 'strict'} />
        </View>
        <Text style={styles.helpText}>Strict Lite không khóa ứng dụng khác; quy tắc rời app sẽ được áp dụng khi phiên chạy.</Text>
      </PixelPanel>
      <PixelPanel>
        <SectionLabel>Loại công việc</SectionLabel>
        <View accessibilityRole="radiogroup" style={styles.chipRow}>
          {(Object.keys(tagLabels) as WorkTag[]).map((tag) => (
            <ChoiceChip disabled={busy} key={tag} label={tagLabels[tag]} onPress={() => onSetWorkTag(tag)} selected={configuration.workTag === tag} />
          ))}
        </View>
      </PixelPanel>
      <PrimaryButton busy={busy} label={busy ? 'Đang bắt đầu…' : `Bắt đầu ${configuration.durationMinutes} phút`} onPress={onStart} />
      <SecondaryButton disabled={busy} label="Về Pet Room" onPress={onBack} />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceColumn: { gap: 9 },
  helpText: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
});
