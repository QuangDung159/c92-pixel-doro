import { useState } from 'react';
import type { PetCompanionProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ConfirmationModal,
  ErrorState,
  InlineNotice,
  PetCompanionStatus,
  PixelCompanion,
  PixelPanel,
  PrimaryButton,
  PrototypeScreen,
  ScreenHeader,
  SecondaryButton,
} from '@/presentation/components';
import {
  ControlButton,
  PrototypeBadge,
  PrototypeControls,
} from '@/presentation/prototype/components';
import type {
  BreakOutcome,
  PrototypeBreakResult,
  PrototypeSession,
} from '@/presentation/prototype/prototype-state';
import { palette } from '@/presentation/theme/palette';

type BreakSession = Extract<PrototypeSession, { readonly kind: 'break' }>;

export const BreakSessionScreen = ({
  session,
  onResolve,
  onMissingSession,
  onRetryPet,
  pet,
  cancelRequestToken = 0,
}: {
  readonly session: BreakSession | null;
  readonly onResolve: (outcome: BreakOutcome) => void;
  readonly onMissingSession: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetCompanionProjection;
  readonly cancelRequestToken?: number;
}) => {
  const [showCancel, setShowCancel] = useState(false);
  const [dismissedCancelToken, setDismissedCancelToken] = useState(0);
  const cancelVisible = showCancel || cancelRequestToken > dismissedCancelToken;

  if (session === null) {
    return (
      <PrototypeScreen>
        <ErrorState
          body="Break mock không còn trong bộ nhớ. Không có Break thật nào được tạo."
          onRetry={onMissingSession}
          title="Không tìm thấy Break prototype"
        />
      </PrototypeScreen>
    );
  }

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <View style={styles.topRow}>
        <Text style={styles.breakKind}>{session.breakKind === 'long' ? 'LONG BREAK' : 'SHORT BREAK'}</Text>
        <Text style={styles.fakeIndicator}>MOCK COUNTDOWN</Text>
      </View>
      <View accessible accessibilityLabel={`Còn ${session.durationMinutes} phút nghỉ`} style={styles.timerBlock}>
        <Text style={styles.timerValue}>{String(session.durationMinutes).padStart(2, '0')}:00</Text>
        <Text style={styles.timerCaption}>RỜI MÀN HÌNH. THỞ MỘT NHỊP.</Text>
      </View>
      <PetCompanionStatus onRetry={onRetryPet} projection={pet} />
      <InlineNotice>
        Break không áp dụng Strict Mode và không nhận XP hoặc Coin. Background không làm Break thất bại.
      </InlineNotice>
      <SecondaryButton label="Kết thúc nghỉ sớm" onPress={() => setShowCancel(true)} />
      <PrototypeControls>
        <ControlButton label="Complete" onPress={() => onResolve('completed')} />
        <ControlButton label="Cancelled" onPress={() => onResolve('cancelled')} />
      </PrototypeControls>
      <ConfirmationModal
        body="Bạn sẽ quay về Pet Room. Break này không tạo phần thưởng hoặc thay đổi phiên Focus đã hoàn thành."
        confirmLabel="Kết thúc nghỉ"
        onConfirm={() => onResolve('cancelled')}
        onDismiss={() => {
          setShowCancel(false);
          setDismissedCancelToken(cancelRequestToken);
        }}
        title="Kết thúc nghỉ sớm?"
        visible={cancelVisible}
      />
    </PrototypeScreen>
  );
};

export const BreakResultScreen = ({
  result,
  onHome,
}: {
  readonly result: PrototypeBreakResult | null;
  readonly onHome: () => void;
}) => {
  if (result === null) {
    return (
      <PrototypeScreen>
        <ErrorState body="Chưa có kết quả Break mock." onRetry={onHome} title="Thiếu kết quả nghỉ" />
      </PrototypeScreen>
    );
  }

  const completed = result.outcome === 'completed';
  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description={
          completed
            ? `${result.durationMinutes} phút nghỉ đã kết thúc. Break không tạo XP hoặc Coin.`
            : 'Bạn đã kết thúc Break sớm. Không có tiến trình nào bị mất.'
        }
        eyebrow={completed ? 'BREAK COMPLETE' : 'BREAK CANCELLED'}
        title={completed ? 'Đã nạp lại một chút năng lượng.' : 'Mình quay lại khi sẵn sàng.'}
      />
      <PixelCompanion state="idle" />
      <PixelPanel>
        <Text style={styles.resultTitle}>Không có reward cho Break</Text>
        <Text style={styles.resultBody}>Người bạn nhỏ đã trở về trạng thái chờ. Focus tiếp theo chỉ bắt đầu khi bạn chủ động chọn.</Text>
      </PixelPanel>
      <PrimaryButton label="Về Pet Room" onPress={onHome} />
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  breakKind: { color: palette.textPrimary, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  fakeIndicator: { color: palette.accentBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerBlock: { alignItems: 'center', backgroundColor: palette.accentBlue, borderColor: palette.border, borderRadius: 8, borderWidth: 3, gap: 8, paddingHorizontal: 12, paddingVertical: 26 },
  timerValue: { color: palette.white, fontSize: 62, fontVariant: ['tabular-nums'], fontWeight: '900', letterSpacing: 2 },
  timerCaption: { color: palette.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  resultTitle: { color: palette.textPrimary, fontSize: 19, fontWeight: '900' },
  resultBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
});
