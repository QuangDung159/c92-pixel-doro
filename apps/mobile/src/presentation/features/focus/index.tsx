import { useState } from 'react';
import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ChoiceChip,
  ConfirmationModal,
  ErrorState,
  InlineNotice,
  LoadingState,
  PetVisualStatus,
  PrimaryButton,
  PrototypeScreen,
  ScreenHeader,
  SecondaryButton,
  SectionLabel,
  PixelPanel,
} from '@/presentation/components';
import {
  ControlButton,
  PrototypeBadge,
  PrototypeControls,
} from '@/presentation/prototype/components';
import type {
  FocusConfiguration,
  FocusMode,
  FocusOutcome,
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
  onDismissPetFeedbackError,
  pet,
  cancelRequestToken = 0,
}: {
  readonly session: FocusSession | null;
  readonly onResolve: (outcome: FocusOutcome) => void;
  readonly onMissingSession: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
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
      <PetVisualStatus
        onDismissTerminalError={onDismissPetFeedbackError}
        onRetryBase={onRetryPet}
        projection={pet}
      />
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

export { FocusResultScreen } from './focus-result-screen';

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
});
