import { useState } from 'react';
import type {
  PetCompanionProjection,
  PetTerminalFeedbackProjection,
} from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ChoiceChip,
  ConfirmationModal,
  ErrorState,
  InlineNotice,
  LoadingState,
  PetCompanionStatus,
  PetTerminalFeedbackStatus,
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
  FocusConfiguration,
  FocusMode,
  FocusOutcome,
  PrototypeFocusResult,
  PrototypeSession,
  WorkTag,
} from '@/presentation/prototype/prototype-state';
import { palette } from '@/presentation/theme/palette';

const tagLabels: Record<WorkTag, string> = {
  coding: 'Lập trình',
  study: 'Học tập',
  writing: 'Viết',
  reading: 'Đọc',
};

export const FocusSetupScreen = ({
  configuration,
  onSetDuration,
  onSetMode,
  onSetWorkTag,
  onStart,
  onBack,
}: {
  readonly configuration: FocusConfiguration;
  readonly onSetDuration: (duration: number) => void;
  readonly onSetMode: (mode: FocusMode) => void;
  readonly onSetWorkTag: (tag: WorkTag) => void;
  readonly onStart: () => void;
  readonly onBack: () => void;
}) => (
  <PrototypeScreen>
    <PrototypeBadge />
    <ScreenHeader
      description="Chọn một phiên vừa đủ để bạn bắt đầu ngay."
      eyebrow="FOCUS SETUP"
      title="Mình sẽ làm gì tiếp?"
    />
    <PixelPanel>
      <SectionLabel>Thời lượng</SectionLabel>
      <View style={styles.durationRow}>
        <SecondaryButton
          accessibilityLabel="Giảm thời lượng 5 phút"
          disabled={configuration.durationMinutes <= 15}
          label="− 5"
          onPress={() => onSetDuration(configuration.durationMinutes - 5)}
        />
        <View accessibilityLabel={`${configuration.durationMinutes} phút`} style={styles.durationDisplay}>
          <Text style={styles.durationValue}>{configuration.durationMinutes}</Text>
          <Text style={styles.durationUnit}>PHÚT</Text>
        </View>
        <SecondaryButton
          accessibilityLabel="Tăng thời lượng 5 phút"
          disabled={configuration.durationMinutes >= 120}
          label="+ 5"
          onPress={() => onSetDuration(configuration.durationMinutes + 5)}
        />
      </View>
      <View style={styles.chipRow}>
        {[15, 25, 50].map((duration) => (
          <ChoiceChip
            key={duration}
            label={`${duration} phút`}
            onPress={() => onSetDuration(duration)}
            selected={configuration.durationMinutes === duration}
          />
        ))}
      </View>
    </PixelPanel>
    <PixelPanel>
      <SectionLabel>Chế độ</SectionLabel>
      <View style={styles.choiceColumn}>
        <ChoiceChip
          label="Relax · có thể rời app"
          onPress={() => onSetMode('relax')}
          selected={configuration.mode === 'relax'}
        />
        <ChoiceChip
          label="Strict · grace 10 giây"
          onPress={() => onSetMode('strict')}
          selected={configuration.mode === 'strict'}
        />
      </View>
      <Text style={styles.helpText}>
        Strict Lite không khóa app khác. Phiên mock chỉ mô phỏng kết quả để review copy.
      </Text>
    </PixelPanel>
    <PixelPanel>
      <SectionLabel>Loại công việc</SectionLabel>
      <View accessibilityRole="radiogroup" style={styles.chipRow}>
        {(Object.keys(tagLabels) as WorkTag[]).map((tag) => (
          <ChoiceChip
            key={tag}
            label={tagLabels[tag]}
            onPress={() => onSetWorkTag(tag)}
            selected={configuration.workTag === tag}
          />
        ))}
      </View>
    </PixelPanel>
    <PrimaryButton label={`Bắt đầu ${configuration.durationMinutes} phút`} onPress={onStart} />
    <SecondaryButton label="Về Pet Room" onPress={onBack} />
  </PrototypeScreen>
);

type FocusSession = Exclude<PrototypeSession, { readonly kind: 'break' }>;

export const FocusSessionScreen = ({
  session,
  onResolve,
  onMissingSession,
  onRetryPet,
  pet,
  cancelRequestToken = 0,
}: {
  readonly session: FocusSession | null;
  readonly onResolve: (outcome: FocusOutcome) => void;
  readonly onMissingSession: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetCompanionProjection;
  readonly cancelRequestToken?: number;
}) => {
  const [showCancel, setShowCancel] = useState(false);
  const [dismissedCancelToken, setDismissedCancelToken] = useState(0);
  const [resolving, setResolving] = useState(false);
  const cancelVisible = showCancel || cancelRequestToken > dismissedCancelToken;

  if (session === null) {
    return (
      <PrototypeScreen>
        <ErrorState
          body="Phiên mock không còn trong bộ nhớ. Bạn có thể quay lại Pet Room an toàn."
          onRetry={onMissingSession}
          title="Không tìm thấy phiên prototype"
        />
      </PrototypeScreen>
    );
  }

  if (resolving) {
    return (
      <PrototypeScreen>
        <PrototypeBadge />
        <LoadingState label="Đang xác nhận kết quả mock…" />
        <PrototypeControls>
          <ControlButton label="Trở lại Running" onPress={() => setResolving(false)} />
        </PrototypeControls>
      </PrototypeScreen>
    );
  }

  const isTrial = session.kind === 'trial';
  const isStrict = session.mode === 'strict';

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <View style={styles.sessionTopRow}>
        <Text style={styles.sessionMode}>
          {isTrial ? 'TRIAL · RELAX' : `${session.mode.toUpperCase()} · ${tagLabels[session.workTag]}`}
        </Text>
        <Text style={styles.fakeIndicator}>MOCK COUNTDOWN</Text>
      </View>
      <View accessible accessibilityLabel={`Còn ${session.durationMinutes} phút`} style={styles.timerBlock}>
        <Text style={styles.timerValue}>{String(session.durationMinutes).padStart(2, '0')}:00</Text>
        <Text style={styles.timerCaption}>CỨ BẮT ĐẦU, RỒI NHỊP SẼ ĐẾN.</Text>
      </View>
      <PetCompanionStatus onRetry={onRetryPet} projection={pet} />
      <InlineNotice>
        {isStrict
          ? 'Strict Lite: rời PixelDoro quá 10 giây trước deadline sẽ làm phiên thất bại.'
          : 'Relax: bạn có thể khóa màn hình hoặc chuyển app; phiên vẫn tiếp tục trong sản phẩm thật.'}
      </InlineNotice>
      <SecondaryButton label="Dừng phiên" onPress={() => setShowCancel(true)} />
      <PrototypeControls>
        <ControlButton label="Resolving" onPress={() => setResolving(true)} />
        <ControlButton label="Complete" onPress={() => onResolve('completed')} />
        {isStrict ? <ControlButton label="Strict fail" onPress={() => onResolve('failed')} /> : null}
        <ControlButton label="Cancelled" onPress={() => onResolve('cancelled')} />
      </PrototypeControls>
      <ConfirmationModal
        body="Phiên này sẽ kết thúc và không nhận XP hoặc Coin. Tiến trình trước đó vẫn an toàn."
        confirmLabel="Dừng phiên"
        onConfirm={() => onResolve('cancelled')}
        onDismiss={() => {
          setShowCancel(false);
          setDismissedCancelToken(cancelRequestToken);
        }}
        title="Dừng phiên tập trung?"
        visible={cancelVisible}
      />
    </PrototypeScreen>
  );
};

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
  petFeedback,
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
  readonly pet: PetCompanionProjection;
  readonly petFeedback: PetTerminalFeedbackProjection;
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
      <PetTerminalFeedbackStatus
        baseProjection={pet}
        feedbackProjection={petFeedback}
        onDismissFeedbackError={onDismissPetFeedbackError}
        onRetryBase={onRetryPet}
      />
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
  durationRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  durationDisplay: { alignItems: 'center', flex: 1 },
  durationValue: { color: palette.textPrimary, fontSize: 48, fontWeight: '900', lineHeight: 52 },
  durationUnit: { color: palette.textSecondary, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceColumn: { gap: 9 },
  helpText: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  sessionTopRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  sessionMode: { color: palette.textPrimary, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  fakeIndicator: { color: palette.accentBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerBlock: { alignItems: 'center', backgroundColor: palette.textPrimary, borderColor: palette.border, borderRadius: 8, borderWidth: 3, gap: 8, paddingHorizontal: 12, paddingVertical: 26 },
  timerValue: { color: palette.accentGold, fontSize: 62, fontVariant: ['tabular-nums'], fontWeight: '900', letterSpacing: 2 },
  timerCaption: { color: palette.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  rewardEyebrow: { color: palette.textPrimary, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  rewardCopy: { color: palette.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  noRewardTitle: { color: palette.textPrimary, fontSize: 19, fontWeight: '900' },
});
