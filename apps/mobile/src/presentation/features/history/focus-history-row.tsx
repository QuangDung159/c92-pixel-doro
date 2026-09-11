import type { FocusHistoryItemProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { HistoryStatusBadge, historyStatusLabel } from './history-status-badge';

const workTagLabels: Record<FocusHistoryItemProjection['workTag'], string> = {
  coding: 'Lập trình',
  study: 'Học tập',
  writing: 'Viết',
  reading: 'Đọc',
};

export const formatHistoryLocalDate = (localDate: string): string => {
  const [year, month, day] = localDate.split('-');
  return `${day}/${month}/${year}`;
};

export const FocusHistoryRow = ({
  item,
}: {
  readonly item: FocusHistoryItemProjection;
}) => {
  const date = formatHistoryLocalDate(item.scheduledEndLocalDate);
  const tag = workTagLabels[item.workTag];
  const status = historyStatusLabel(item.status);
  return (
    <View
      accessible
      accessibilityLabel={`${date}, ${item.configuredDurationMinutes} phút, ${tag}, ${status}`}
      accessibilityRole="text"
      style={styles.row}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>
          {item.configuredDurationMinutes} phút · {tag}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <HistoryStatusBadge status={item.status} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  copy: { flex: 1, gap: 5, minWidth: 160 },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 23,
  },
  date: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
});
