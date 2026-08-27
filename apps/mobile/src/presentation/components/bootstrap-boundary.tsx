import type { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useBootstrapProjection } from '@/presentation/providers/mobile-application-context';
import { palette } from '@/presentation/theme/palette';

export const BootstrapBoundary = ({ children }: PropsWithChildren) => {
  const projection = useBootstrapProjection();

  if (projection.status === 'recovery') {
    return (
      <View
        accessibilityRole="alert"
        accessibilityLabel="Không thể khởi động PixelDoro"
        style={styles.centered}
      >
        <Text style={styles.title}>PixelDoro cần được khôi phục</Text>
        <Text style={styles.body}>Mã lỗi: {projection.error.code}</Text>
      </View>
    );
  }

  if (projection.status !== 'ready') {
    return (
      <View
        accessibilityLabel="PixelDoro đang khởi động"
        accessibilityLiveRegion="polite"
        style={styles.centered}
      >
        <ActivityIndicator color={palette.border} size="large" />
        <Text style={styles.body}>Đang chuẩn bị không gian tập trung…</Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

