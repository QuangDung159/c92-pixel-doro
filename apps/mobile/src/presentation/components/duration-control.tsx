import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';
import { SecondaryButton } from './button';
import { ChoiceChip } from './choice-chip';

export interface DurationControlProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly quickValues: readonly number[];
  readonly onChange: (value: number) => void;
  readonly disabled?: boolean;
}

export const DurationControl = ({
  value,
  min,
  max,
  step,
  quickValues,
  onChange,
  disabled = false,
}: DurationControlProps) => (
  <View accessibilityLabel="Thời lượng phiên tập trung" style={styles.container}>
    <View style={styles.durationRow}>
      <SecondaryButton
        accessibilityLabel={`Giảm thời lượng ${step} phút`}
        disabled={disabled || value <= min}
        label={`− ${step}`}
        onPress={() => onChange(value - step)}
      />
      <View accessible accessibilityLabel={`${value} phút`} style={styles.durationDisplay}>
        <Text style={styles.durationValue}>{value}</Text>
        <Text style={styles.durationUnit}>PHÚT</Text>
      </View>
      <SecondaryButton
        accessibilityLabel={`Tăng thời lượng ${step} phút`}
        disabled={disabled || value >= max}
        label={`+ ${step}`}
        onPress={() => onChange(value + step)}
      />
    </View>
    <View accessibilityRole="radiogroup" style={styles.quickValues}>
      {quickValues.map((duration) => (
        <ChoiceChip
          disabled={disabled}
          key={duration}
          label={`${duration} phút`}
          onPress={() => onChange(duration)}
          selected={value === duration}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 12 },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  durationDisplay: { alignItems: 'center', flex: 1 },
  durationValue: {
    color: palette.textPrimary,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  durationUnit: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quickValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
