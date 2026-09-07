import { useState } from 'react';
import type { PetVisualProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  ConfirmationModal,
  ErrorState,
  InlineNotice,
  LoadingState,
  PetVisualStatus,
  PrototypeScreen,
  SecondaryButton,
} from '@/presentation/components';
import {
  ControlButton,
  PrototypeBadge,
  PrototypeControls,
} from '@/presentation/prototype/components';
import type {
  FocusOutcome,
  PrototypeSession,
  WorkTag,
} from '@/presentation/prototype/prototype-state';
import { palette } from '@/presentation/theme/palette';

const tagLabels: Record<WorkTag, string> = {
  coding: 'Lập trình', study: 'Học tập', writing: 'Viết', reading: 'Đọc',
};

type FocusSession = Exclude<PrototypeSession, { readonly kind: 'break' }>;

export interface PrototypeFocusSessionScreenProps {
  readonly session: FocusSession | null;
  readonly onResolve: (outcome: FocusOutcome) => void;
  readonly onMissingSession: () => void;
  readonly onRetryPet: () => void;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly cancelRequestToken?: number;
}

export const PrototypeFocusSessionScreen = ({
  session,
  onResolve,
  onMissingSession,
  onRetryPet,
  onDismissPetFeedbackError,
  pet,
  cancelRequestToken = 0,
}: PrototypeFocusSessionScreenProps) => {
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
      <PetVisualStatus onDismissTerminalError={onDismissPetFeedbackError} onRetryBase={onRetryPet} projection={pet} />
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

const styles = StyleSheet.create({
  sessionTopRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  sessionMode: { color: palette.textPrimary, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  fakeIndicator: { color: palette.accentBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerBlock: { alignItems: 'center', backgroundColor: palette.textPrimary, borderColor: palette.border, borderRadius: 8, borderWidth: 3, gap: 8, paddingHorizontal: 12, paddingVertical: 26 },
  timerValue: { color: palette.accentGold, fontSize: 62, fontVariant: ['tabular-nums'], fontWeight: '900', letterSpacing: 2 },
  timerCaption: { color: palette.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
});
