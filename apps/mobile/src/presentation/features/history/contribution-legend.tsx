import type { ContributionIntensityBand } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { contributionRangeLabels } from './contribution-day-row';
import { contributionVisualTokens } from './contribution-visual-tokens';

const bands: readonly ContributionIntensityBand[] = ['zero', 'low', 'medium', 'high', 'peak'];
const legendLabel = bands.map((band) => contributionRangeLabels[band]).join(', ');

export const ContributionLegend = () => (
  <View
    accessible
    accessibilityLabel={`Mức đóng góp: ${legendLabel}`}
    accessibilityRole="text"
    style={styles.legend}
  >
    <Text style={styles.title}>Mức đóng góp</Text>
    <View style={styles.items}>
      {bands.map((band) => {
        const tokens = contributionVisualTokens(band);
        return (
          <View key={band} style={styles.item}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.swatch,
                { backgroundColor: tokens.fillColor, borderColor: tokens.borderColor },
              ]}
            />
            <Text style={styles.range}>{contributionRangeLabels[band]}</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  legend: { gap: 8 },
  title: { color: palette.textPrimary, fontSize: 13, fontWeight: '900', lineHeight: 19 },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 100 },
  swatch: { borderRadius: 2, borderWidth: 2, height: 16, width: 16 },
  range: { color: palette.textSecondary, fontSize: 12, fontWeight: '700', lineHeight: 17 },
});
