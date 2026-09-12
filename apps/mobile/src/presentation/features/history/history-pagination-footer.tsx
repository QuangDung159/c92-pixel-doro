import { StyleSheet, View } from 'react-native';

import { InlineNotice, SecondaryButton } from '@/presentation/components';

export type HistoryPaginationStatus = 'idle' | 'loading' | 'error' | 'end';

export const HistoryPaginationFooter = ({
  onLoadMore,
  onRetry,
  status,
}: {
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
  readonly status: HistoryPaginationStatus;
}) => {
  if (status === 'end') return null;
  if (status === 'error') {
    return (
      <View style={styles.footer}>
        <InlineNotice announce>Chưa tải thêm được lịch sử.</InlineNotice>
        <SecondaryButton label="Thử tải lại" onPress={onRetry} />
      </View>
    );
  }
  return (
    <View style={styles.footer}>
      <SecondaryButton
        busy={status === 'loading'}
        label={status === 'loading' ? 'Đang tải lịch sử…' : 'Xem thêm'}
        onPress={onLoadMore}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { gap: 10, paddingTop: 16 },
});
