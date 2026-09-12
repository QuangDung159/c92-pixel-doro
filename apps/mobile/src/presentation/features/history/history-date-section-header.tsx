import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { formatHistoryLocalDate } from './focus-history-row';

export const HistoryDateSectionHeader = ({
  completedMinutes,
  localDate,
}: {
  readonly completedMinutes: number;
  readonly localDate: string;
}) => {
  const date = formatHistoryLocalDate(localDate);
  return (
    <View
      accessible
      accessibilityLabel={`${date}, ${completedMinutes} phút hoàn thành`}
      accessibilityRole="header"
      style={styles.header}
    >
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.total}>{completedMinutes} phút hoàn thành</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: palette.white,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingTop: 12,
  },
  date: { color: palette.textPrimary, fontSize: 14, fontWeight: '900' },
  total: { color: palette.textSecondary, fontSize: 13, fontWeight: '700' },
});
