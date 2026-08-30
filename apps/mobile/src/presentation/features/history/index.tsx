import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ControlButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PixelPanel,
  PrototypeBadge,
  PrototypeControls,
  PrototypeScreen,
  ScreenHeader,
} from '@/presentation/components/prototype-ui';
import { palette } from '@/presentation/theme/palette';

type HistoryReviewState = 'empty' | 'sample' | 'loading' | 'error';

export const HistoryScreen = () => {
  const [reviewState, setReviewState] = useState<HistoryReviewState>('empty');

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description="Nhìn lại nỗ lực mà không biến nó thành áp lực."
        eyebrow="HISTORY"
        title="Những nhịp đã hoàn thành."
      />
      {reviewState === 'empty' ? (
        <EmptyState body="Phiên Focus chuẩn đầu tiên sẽ xuất hiện ở đây. Trial 5 phút không được tính." title="Chưa có lịch sử Focus" />
      ) : null}
      {reviewState === 'loading' ? <LoadingState label="Đang dựng hành trình…" /> : null}
      {reviewState === 'error' ? (
        <ErrorState body="Không đọc được lịch sử mock. Hãy thử lại mà không ảnh hưởng phiên hiện tại." onRetry={() => setReviewState('sample')} title="Lịch sử chưa sẵn sàng" />
      ) : null}
      {reviewState === 'sample' ? (
        <>
          <PixelPanel>
            <Text style={styles.sectionTitle}>7 ngày gần đây</Text>
            <View accessibilityLabel="Contribution preview trung tính, màu chưa được chốt" style={styles.graphRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <View key={day} style={[styles.graphCell, day === 2 && styles.graphCellFilled, day === 5 && styles.graphCellFilled]} />
              ))}
            </View>
            <Text style={styles.pendingCopy}>Intensity color đang chờ `OPEN-006`; preview không khóa ngưỡng màu.</Text>
          </PixelPanel>
          <PixelPanel>
            <Text style={styles.sectionTitle}>Gần đây</Text>
            <View style={styles.sessionRow}>
              <View style={styles.statusCompleted} />
              <View style={styles.sessionCopy}>
                <Text style={styles.sessionTitle}>25 phút · Lập trình</Text>
                <Text style={styles.sessionMeta}>Hoàn thành · +25 XP · +5 Coin</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.sessionRow}>
              <View style={styles.statusCancelled} />
              <View style={styles.sessionCopy}>
                <Text style={styles.sessionTitle}>15 phút · Đọc</Text>
                <Text style={styles.sessionMeta}>Đã hủy · không reward</Text>
              </View>
            </View>
          </PixelPanel>
        </>
      ) : null}
      <PrototypeControls>
        <ControlButton label="Empty" onPress={() => setReviewState('empty')} />
        <ControlButton label="Sample" onPress={() => setReviewState('sample')} />
        <ControlButton label="Loading" onPress={() => setReviewState('loading')} />
        <ControlButton label="Error" onPress={() => setReviewState('error')} />
      </PrototypeControls>
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: '900' },
  graphRow: { flexDirection: 'row', gap: 7 },
  graphCell: { backgroundColor: palette.background, borderColor: palette.border, borderWidth: 2, flex: 1, height: 38 },
  graphCellFilled: { backgroundColor: palette.surfaceStrong },
  pendingCopy: { color: palette.textSecondary, fontSize: 11, lineHeight: 17 },
  sessionRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  statusCompleted: { backgroundColor: palette.accent, height: 14, width: 14 },
  statusCancelled: { backgroundColor: palette.textSecondary, height: 14, width: 14 },
  sessionCopy: { flex: 1, gap: 3 },
  sessionTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: '900' },
  sessionMeta: { color: palette.textSecondary, fontSize: 12 },
  divider: { backgroundColor: palette.border, height: 1, opacity: 0.2 },
});
