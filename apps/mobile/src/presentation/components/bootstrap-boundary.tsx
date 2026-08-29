import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useBootstrapProjection,
  useRecoveryRetry,
} from '@/presentation/providers/mobile-application-context';
import { palette } from '@/presentation/theme/palette';

export interface RecoveryBoundaryContentProps {
  readonly onRetry: () => void;
}

export const RecoveryBoundaryContent = ({
  onRetry,
}: RecoveryBoundaryContentProps) => (
  <View
    accessibilityRole="alert"
    accessibilityLabel="Không thể khởi động PixelDoro"
    style={styles.centered}
  >
    <Text style={styles.title}>PixelDoro chưa thể sẵn sàng</Text>
    <Text style={styles.body}>
      Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử lại để tiếp tục.
    </Text>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Thử lại khởi động PixelDoro"
      onPress={onRetry}
      style={styles.retryButton}
    >
      <Text style={styles.retryButtonText}>Thử lại</Text>
    </Pressable>
  </View>
);

export const BootstrapBoundary = ({ children }: PropsWithChildren) => {
  const projection = useBootstrapProjection();
  const retryRecovery = useRecoveryRetry();

  if (projection.status === 'recovery') {
    return <RecoveryBoundaryContent onRetry={() => void retryRecovery()} />;
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
  retryButton: {
    backgroundColor: palette.border,
    borderRadius: 12,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
