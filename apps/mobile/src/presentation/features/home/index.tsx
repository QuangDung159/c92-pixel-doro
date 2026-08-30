import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ControlButton,
  ErrorState,
  LoadingState,
  PixelCompanion,
  PixelPanel,
  PrimaryButton,
  PrototypeBadge,
  PrototypeControls,
  PrototypeScreen,
  ScreenHeader,
  Stat,
} from '@/presentation/components/prototype-ui';
import { palette } from '@/presentation/theme/palette';

type HomeReviewState = 'ready' | 'loading' | 'error';

export const HomeScreen = ({ onStartFocus }: { readonly onStartFocus: () => void }) => {
  const [reviewState, setReviewState] = useState<HomeReviewState>('ready');

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description="Một căn phòng nhỏ cho những nỗ lực lớn."
        eyebrow="PET ROOM · HÔM NAY"
        title="Chào bạn trở lại."
      />

      {reviewState === 'loading' ? <LoadingState label="Đang mở Pet Room…" /> : null}
      {reviewState === 'error' ? (
        <ErrorState
          body="Dữ liệu mock chưa hiển thị được. Không có tiến trình thật nào bị thay đổi."
          onRetry={() => setReviewState('ready')}
          title="Pet Room cần thử lại"
        />
      ) : null}
      {reviewState === 'ready' ? (
        <>
          <PixelCompanion state="idle" />
          <View style={styles.statsRow}>
            <Stat label="Level" value="1" />
            <Stat label="XP" value="30" />
            <Stat label="Coin" value="6" />
          </View>
          <PixelPanel tone="strong">
            <Text style={styles.cardEyebrow}>TIẾP THEO</Text>
            <Text style={styles.cardTitle}>Sẵn sàng cho một phiên 25 phút?</Text>
            <Text style={styles.cardBody}>Bạn có thể đổi thời lượng, chế độ và loại công việc trước khi bắt đầu.</Text>
            <PrimaryButton label="Bắt đầu tập trung" onPress={onStartFocus} />
          </PixelPanel>
          <PixelPanel>
            <Text style={styles.cardEyebrow}>TIẾN TRÌNH PHÒNG</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.cardBody}>Thêm 4 Coin để mở được chậu cây nhỏ đầu tiên.</Text>
          </PixelPanel>
        </>
      ) : null}

      <PrototypeControls>
        <ControlButton label="Ready" onPress={() => setReviewState('ready')} />
        <ControlButton label="Loading" onPress={() => setReviewState('loading')} />
        <ControlButton label="Recovery" onPress={() => setReviewState('error')} />
      </PrototypeControls>
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 9 },
  cardEyebrow: { color: palette.accentDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  cardTitle: { color: palette.textPrimary, fontSize: 21, fontWeight: '900', lineHeight: 27 },
  cardBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
  progressTrack: { backgroundColor: palette.background, borderColor: palette.border, borderWidth: 2, height: 22, overflow: 'hidden' },
  progressFill: { backgroundColor: palette.accentGold, height: '100%', width: '60%' },
});
