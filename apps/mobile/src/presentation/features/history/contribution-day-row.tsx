import type { DailyContributionProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { formatHistoryLocalDate } from './focus-history-row';

const rangeLabels: Record<DailyContributionProjection['intensity'], string> = {
  zero: '0 phút',
  low: '1–24 phút',
  medium: '25–49 phút',
  high: '50–99 phút',
  peak: '100+ phút',
};

export const ContributionDayRow = ({
  day,
}: {
  readonly day: DailyContributionProjection;
}) => {
  const date = formatHistoryLocalDate(day.localDate);
  const range = rangeLabels[day.intensity];
  return (
    <View
      accessible
      accessibilityLabel={`${date}, ${day.completedMinutes} phút Focus hoàn thành, ${day.completedSessionCount} phiên hoàn thành, mức ${range}`}
      accessibilityRole="text"
      style={styles.row}
    >
      <Text style={styles.date}>{date.slice(0, 5)}</Text>
      <View style={styles.value}>
        <Text style={styles.minutes}>{day.completedMinutes} phút</Text>
        <Text style={styles.sessions}>{day.completedSessionCount} phiên hoàn thành</Text>
      </View>
      <Text style={styles.range}>{range}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    minHeight: 54,
    paddingVertical: 8,
  },
  date: { color: palette.textPrimary, fontSize: 14, fontWeight: '900', minWidth: 44 },
  value: { flex: 1, minWidth: 135 },
  minutes: { color: palette.textPrimary, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  sessions: { color: palette.textSecondary, fontSize: 12, lineHeight: 17 },
  range: { color: palette.textSecondary, fontSize: 12, fontWeight: '700' },
});

export { rangeLabels as contributionRangeLabels };
