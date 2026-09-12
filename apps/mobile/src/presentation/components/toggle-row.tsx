import { StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface ToggleRowProps {
  readonly label: string;
  readonly body: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly disabled?: boolean;
  readonly busy?: boolean;
}

export const ToggleRow = ({
  label,
  body,
  value,
  onValueChange,
  disabled = false,
  busy = false,
}: ToggleRowProps) => (
  <View style={styles.row}>
    <View style={[styles.copy, busy && styles.copyBusy]}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
    <Switch
      accessibilityHint={body}
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: disabled || busy, checked: value }}
      disabled={disabled || busy}
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
  copyBusy: { opacity: 0.5 },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 12, lineHeight: 18 },
});
