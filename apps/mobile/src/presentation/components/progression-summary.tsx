import type { HomeProfileProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';
import { Panel } from './panel';
import { StatDisplay } from './stat-display';
import { palette } from '@/presentation/theme/palette';

export type ProgressionSummaryProps =
  | {
      readonly variant?: 'result';
      readonly totalXp: number;
      readonly coinBalance: number;
    }
  | {
      readonly variant: 'full' | 'compact';
      readonly progression: HomeProfileProjection;
    };

export const ProgressionSummary = (props: ProgressionSummaryProps) => {
  if ('progression' in props) {
    const { progression } = props;
    const progressWidth = `${progression.levelProgressPercent}%` as `${number}%`;
    return (
      <Panel tone={props.variant === 'compact' ? 'strong' : 'default'}>
        <View
          accessible
          accessibilityLabel={`Level ${progression.level}, tổng ${progression.totalXp} XP, ${progression.coinBalance} Coin, còn ${progression.xpToNextLevel} XP để đạt Level ${progression.level + 1}`}
          accessibilityRole="summary"
        >
          <Text style={styles.title}>Tiến trình hiện tại</Text>
          <View style={styles.row}>
            <StatDisplay label="Level" value={`${progression.level}`} />
            <StatDisplay label="Tổng XP" value={`${progression.totalXp}`} />
            <StatDisplay label="Coin hiện có" value={`${progression.coinBalance}`} />
          </View>
        </View>
        <View
          accessibilityLabel={`Tiến trình Level ${progression.level}: ${progression.levelProgressPercent} phần trăm`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progression.levelProgressPercent }}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.body}>
          Còn {progression.xpToNextLevel} XP để đạt Level {progression.level + 1}.
        </Text>
      </Panel>
    );
  }
  return (
    <Panel>
      <View accessible accessibilityLabel={`Tổng hiện tại: ${props.totalXp} XP và ${props.coinBalance} Coin`}>
        <Text style={styles.title}>Tiến trình hiện tại</Text>
        <View style={styles.row}>
          <StatDisplay label="Tổng XP" value={`${props.totalXp}`} />
          <StatDisplay label="Coin hiện có" value={`${props.coinBalance}`} />
        </View>
      </View>
    </Panel>
  );
};
const styles = StyleSheet.create({
  title: { color: palette.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  body: { color: palette.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 10 },
  progressTrack: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderWidth: 2,
    height: 22,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: palette.accentGold, height: '100%' },
});
