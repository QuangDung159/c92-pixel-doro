import type { FocusHistoryItemProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export type HistoryStatus = FocusHistoryItemProjection['status'];

export const historyStatusLabel = (status: HistoryStatus): string => {
  switch (status) {
    case 'completed':
      return 'Hoàn thành';
    case 'failed':
      return 'Thất bại';
    case 'cancelled':
      return 'Đã hủy';
  }
};

export const HistoryStatusBadge = ({ status }: { readonly status: HistoryStatus }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[
      styles.badge,
      status === 'completed' && styles.completed,
      status === 'failed' && styles.failed,
      status === 'cancelled' && styles.cancelled,
    ]}
  >
    <Text style={styles.label}>{historyStatusLabel(status)}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderColor: palette.border,
    borderRadius: 4,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completed: { backgroundColor: palette.surfaceStrong },
  failed: { backgroundColor: '#F5C5B8' },
  cancelled: { backgroundColor: palette.background },
  label: { color: palette.textPrimary, fontSize: 12, fontWeight: '900' },
});
