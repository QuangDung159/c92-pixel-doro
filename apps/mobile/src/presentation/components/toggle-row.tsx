import { StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface ToggleRowProps {
  readonly label: string;
  readonly body: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

export const ToggleRow = ({
  label,
  body,
  value,
  onValueChange,
  disabled = false,
}: ToggleRowProps) => (
  <View style={styles.row}>
    <View style={styles.copy}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
    <Switch
      accessibilityHint={body}
      accessibilityLabel={label}
      accessibilityState={{ disabled, checked: value }}
      disabled={disabled}
      onValueChange={onValueChange}
      thumbColor={palette.white}
      trackColor={{ false: palette.textSecondary, true: palette.accentDark }}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    minHeight: 64,
  },
  copy: { flex: 1, gap: 3 },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 12, lineHeight: 18 },
});
