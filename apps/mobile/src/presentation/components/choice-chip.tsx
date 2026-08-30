import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface ChoiceChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}

export const ChoiceChip = ({
  label,
  selected,
  onPress,
  disabled = false,
}: ChoiceChipProps) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ disabled, selected }}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.chip,
      selected && styles.selected,
      disabled && styles.disabled,
    ]}
  >
    <Text style={[styles.text, selected && styles.selectedText]}>
      {selected ? `✓ ${label}` : label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 5,
    borderWidth: 2,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  selected: { backgroundColor: palette.textPrimary },
  text: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectedText: { color: palette.white },
  disabled: { opacity: 0.45 },
});
