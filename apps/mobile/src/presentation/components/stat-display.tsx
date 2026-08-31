import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface StatDisplayProps {
  readonly label: string;
  readonly value: string;
}

export const StatDisplay = ({ label, value }: StatDisplayProps) => (
  <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.stat}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

export const Stat = StatDisplay;

const styles = StyleSheet.create({
  stat: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 5,
    borderWidth: 2,
    flex: 1,
    gap: 2,
    minWidth: 88,
    padding: 12,
  },
  value: { color: palette.textPrimary, fontSize: 22, fontWeight: '900' },
  label: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
