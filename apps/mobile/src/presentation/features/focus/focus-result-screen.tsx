import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ErrorState,
  PetVisualStatus,
  PixelPanel,
  PrimaryButton,
  PrototypeScreen,
  ScreenHeader,
  SecondaryButton,
  SectionLabel,
  Stat,
} from '@/presentation/components';
import {
  ControlButton,
  PrototypeBadge,
  PrototypeControls,
} from '@/presentation/prototype/components';
import type {
  BreakKind,
  PrototypeFocusResult,
} from '@/presentation/prototype/prototype-state';
import { palette } from '@/presentation/theme/palette';

export const FocusResultScreen = ({
  result,
  nextBreakKind,
  onSetNextBreakKind,
  onStartBreak,
  onHome,
  onRetryFocus,
  onRetryTrial,
  onRetryPet,
  onDismissPetFeedbackError,
  pet,
  terminalReviewFixtureAvailable = false,
  onTriggerTerminalReviewFixture,
}: {
  readonly result: PrototypeFocusResult | null;
  readonly nextBreakKind: BreakKind;
  readonly onSetNextBreakKind: (kind: BreakKind) => void;
  readonly onStartBreak: () => void;
  readonly onHome: () => void;
  readonly onRetryFocus: () => void;
  readonly onRetryTrial: () => void;
  readonly onRetryPet: () => void;
  readonly onDismissPetFeedbackError: () => void;
  readonly pet: PetVisualProjection;
  readonly terminalReviewFixtureAvailable?: boolean;
  readonly onTriggerTerminalReviewFixture: () => void;
}) => {
  if (result === null) {
    return (
      <PrototypeScreen>
        <ErrorState body="Chưa có kết quả mock để hiển thị." onRetry={onHome} title="Thiếu kết quả phiên" />
      </PrototypeScreen>
    );
  }

  const completed = result.outcome === 'completed';
  const failed = result.outcome === 'failed';
  const trial = result.kind === 'trial';
  const title = completed
    ? trial
      ? 'Bạn đã mở khóa nhịp đầu tiên.'
      : 'Hai bạn đã làm được rồi.'
    : failed
      ? 'Phiên này bị gián đoạn.'
      : 'Phiên đã dừng.';

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description={
          completed
            ? `${result.durationMinutes} phút tập trung đã trở thành tiến trình nhìn thấy được.`
            : failed
              ? 'Không sao cả. Tiến trình cũ vẫn nguyên vẹn và bạn có thể thử một phiên phù hợp hơn.'
              : 'Bạn đã chủ động dừng lại. Không có phần thưởng nào được tạo cho phiên này.'
        }
        eyebrow={completed ? 'FOCUS COMPLETE' : failed ? 'STRICT INTERRUPTED' : 'FOCUS CANCELLED'}
        title={title}
      />
      <PetVisualStatus
        onDismissTerminalError={onDismissPetFeedbackError}
        onRetryBase={onRetryPet}
        projection={pet}
      />
      {terminalReviewFixtureAvailable ? (
        <PrototypeControls>
          <ControlButton label="Emit Pet review fixture" onPress={onTriggerTerminalReviewFixture} />
        </PrototypeControls>
      ) : null}
      {completed ? (
        <PixelPanel tone="gold">
          <Text style={styles.rewardEyebrow}>REWARD FEEDBACK · MOCK</Text>
          <View style={styles.statsRow}>
            <Stat label="XP nhận" value={`+${result.xpEarned}`} />
            <Stat label="Coin nhận" value={`+${result.coinsEarned}`} />
          </View>
          <Text style={styles.rewardCopy}>Phần thưởng được mô phỏng là đã cấp tự động — không có bước Claim.</Text>
        </PixelPanel>
      ) : (
        <PixelPanel tone={failed ? 'danger' : 'default'}>
          <Text style={styles.noRewardTitle}>Không nhận XP hoặc Coin</Text>
          <Text style={styles.helpText}>Một phiên chưa hoàn thành không làm mất tiến trình bạn đã có.</Text>
        </PixelPanel>
      )}
      {completed && trial ? <PrimaryButton label="Vào Pet Room" onPress={onHome} /> : null}
      {completed && !trial ? (
        <>
          <PixelPanel>
            <SectionLabel>Bước tiếp theo là do bạn chọn</SectionLabel>
            <PrimaryButton
              label={`Bắt đầu nghỉ ${nextBreakKind === 'long' ? '15' : '5'} phút`}
              onPress={onStartBreak}
            />
            <SecondaryButton label="Về Pet Room" onPress={onHome} />
          </PixelPanel>
          <PrototypeControls>
            <ControlButton label="Short Break 5m" onPress={() => onSetNextBreakKind('short')} />
            <ControlButton label="Long Break 15m" onPress={() => onSetNextBreakKind('long')} />
          </PrototypeControls>
        </>
      ) : null}
      {!completed ? (
        <>
          <PrimaryButton
            label={trial ? 'Thử lại phiên 5 phút' : 'Thiết lập phiên mới'}
            onPress={trial ? onRetryTrial : onRetryFocus}
          />
          <SecondaryButton
            label={trial ? 'Về giới thiệu' : 'Về Pet Room'}
            onPress={trial ? onRetryTrial : onHome}
          />
        </>
      ) : null}
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  rewardEyebrow: { color: palette.textPrimary, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  rewardCopy: { color: palette.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  noRewardTitle: { color: palette.textPrimary, fontSize: 19, fontWeight: '900' },
  helpText: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
});
