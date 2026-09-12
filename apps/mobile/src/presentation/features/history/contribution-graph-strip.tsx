import type { DailyContributionProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { contributionVisualTokens } from './contribution-visual-tokens';

export const ContributionGraphStrip = ({
  days,
}: {
  readonly days: readonly DailyContributionProjection[];
}) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={styles.strip}
  >
    {days.map((day) => {
      const tokens = contributionVisualTokens(day.intensity);
      return (
        <View key={day.localDate} style={styles.day}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: tokens.fillColor, borderColor: tokens.borderColor },
            ]}
          />
          <Text style={styles.label}>{day.localDate.slice(8, 10)}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  strip: { alignItems: 'flex-end', flexDirection: 'row', gap: 4 },
  day: { alignItems: 'center', flex: 1, gap: 4, minWidth: 0 },
  swatch: {
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: 3,
    borderWidth: 2,
    minHeight: 24,
  },
  label: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
});
