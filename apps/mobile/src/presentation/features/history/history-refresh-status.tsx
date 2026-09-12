import { StyleSheet, View } from 'react-native';

import { InlineNotice, SecondaryButton } from '@/presentation/components';

export type HistoryRefreshStatusValue = 'idle' | 'refreshing' | 'error';

export const HistoryRefreshStatus = ({
  onRetry,
  status,
}: {
  readonly onRetry: () => void;
  readonly status: HistoryRefreshStatusValue;
}) => {
  if (status === 'idle') return null;
  if (status === 'refreshing') {
    return <InlineNotice>Đang cập nhật lịch sử…</InlineNotice>;
  }
  return (
    <View style={styles.error}>
      <InlineNotice announce>Chưa cập nhật được lịch sử mới nhất.</InlineNotice>
      <SecondaryButton label="Thử lại" onPress={onRetry} />
    </View>
  );
};

const styles = StyleSheet.create({
  error: { gap: 10 },
});
