import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { Panel } from './panel';
import { StatDisplay } from './stat-display';

export interface RewardSummaryProps {
  readonly xpEarned: number;
  readonly coinsEarned: number;
}

export const RewardSummary = ({ xpEarned, coinsEarned }: RewardSummaryProps) => (
  <Panel tone="gold">
    <View
      accessible
      accessibilityLabel={`Phần thưởng đã nhận: ${xpEarned} XP và ${coinsEarned} Coin`}
      accessibilityRole="summary"
    >
      <Text style={styles.eyebrow}>PHẦN THƯỞNG ĐÃ GHI NHẬN</Text>
      <View style={styles.stats}>
        <StatDisplay label="XP nhận" value={`+${xpEarned}`} />
        <StatDisplay label="Coin nhận" value={`+${coinsEarned}`} />
      </View>
      <Text style={styles.copy}>Phần thưởng đã được cấp tự động — không cần Claim.</Text>
    </View>
  </Panel>
);

const styles = StyleSheet.create({
  eyebrow: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  stats: { flexDirection: 'row', gap: 10 },
  copy: { color: palette.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 10 },
});
