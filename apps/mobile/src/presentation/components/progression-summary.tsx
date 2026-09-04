import { StyleSheet, Text, View } from 'react-native';
import { Panel } from './panel';
import { StatDisplay } from './stat-display';
import { palette } from '@/presentation/theme/palette';

export interface ProgressionSummaryProps {
  readonly totalXp: number;
  readonly coinBalance: number;
}
export const ProgressionSummary = ({ totalXp, coinBalance }: ProgressionSummaryProps) => (
  <Panel>
    <View accessible accessibilityLabel={`Tổng hiện tại: ${totalXp} XP và ${coinBalance} Coin`}>
      <Text style={styles.title}>Tiến trình hiện tại</Text>
      <View style={styles.row}>
        <StatDisplay label="Tổng XP" value={`${totalXp}`} />
        <StatDisplay label="Coin hiện có" value={`${coinBalance}`} />
      </View>
    </View>
  </Panel>
);
const styles = StyleSheet.create({
  title: { color: palette.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
