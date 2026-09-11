import type { RoomDecorationsControllerProjection } from '@/application';
import { Text, View, StyleSheet } from 'react-native';

import { InlineNotice } from '@/presentation/components/inline-notice';
import { palette } from '@/presentation/theme/palette';

export interface RoomDecorationStatusProps {
  readonly projection: RoomDecorationsControllerProjection;
  readonly onRetry: () => void;
}

export const RoomDecorationStatus = ({ projection, onRetry }: RoomDecorationStatusProps) => {
  if (projection.status === 'idle' || projection.status === 'loading') {
    return <Text style={styles.summary}>Đang sắp xếp căn phòng…</Text>;
  }
  if (projection.status === 'error') {
    return (
      <View style={styles.stack}>
        <InlineNotice>
          {projection.code === 'ROOM_DATA_INVALID'
            ? 'Trang trí đang được ẩn vì dữ liệu phòng chưa hợp lệ. Pet và Focus vẫn dùng được.'
            : 'Chưa đọc được trang trí. Pet và Focus vẫn dùng được.'}
        </InlineNotice>
        <Text accessibilityRole="button" onPress={onRetry} style={styles.retry}>Thử lại</Text>
      </View>
    );
  }
  const names = projection.room.items.map(({ displayName }) => displayName);
  return (
    <View style={styles.stack}>
      <Text accessibilityLiveRegion="none" style={styles.summary}>
        {names.length === 0
          ? 'Phòng chưa có vật phẩm được trang bị.'
          : `Phòng có ${names.length} vật phẩm: ${names.join(', ')}.`}
      </Text>
      {projection.refresh === 'error' ? (
        <View style={styles.stack}>
          <InlineNotice>Đang giữ bố cục gần nhất vì chưa thể làm mới căn phòng.</InlineNotice>
          <Text accessibilityRole="button" onPress={onRetry} style={styles.retry}>Thử lại</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 8 },
  summary: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  retry: { color: palette.accentDark, fontSize: 14, fontWeight: '800' },
});
