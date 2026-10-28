import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useBootstrapProjection,
  useRecoveryRetry,
} from '@/presentation/providers/mobile-application-context';
import { palette } from '@/presentation/theme/palette';

import { ErrorState, LoadingState } from './status-surface';

export interface RecoveryBoundaryContentProps {
  readonly onRetry: () => void;
}

export const RecoveryBoundaryContent = ({
  onRetry,
}: RecoveryBoundaryContentProps) => (
  <View
    accessibilityRole="alert"
    accessibilityLabel="Không thể khởi động Mèo Dev"
    style={styles.centered}
  >
    <ErrorState
      body="Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử lại để tiếp tục."
      onRetry={onRetry}
      title="Mèo Dev chưa thể sẵn sàng"
    />
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
        accessibilityLabel="Mèo Dev đang khởi động"
        accessibilityLiveRegion="polite"
        style={styles.centered}
      >
        <LoadingState label="Đang chuẩn bị không gian tập trung…" />
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  centered: {
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
