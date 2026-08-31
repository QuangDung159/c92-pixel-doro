import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: 'primary' | 'secondary';
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly accessibilityLabel?: string;
}

export const Button = ({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  busy = false,
  accessibilityLabel = label,
}: ButtonProps) => {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        tone === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <Text style={tone === 'primary' ? styles.primaryText : styles.secondaryText}>
        {label}
      </Text>
    </Pressable>
  );
};

export const PrimaryButton = (props: Omit<ButtonProps, 'tone'>) => (
  <Button {...props} tone="primary" />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'tone'>) => (
  <Button {...props} tone="secondary" />
);

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    backgroundColor: palette.textPrimary,
    borderColor: palette.textPrimary,
    borderRadius: 6,
    borderWidth: 3,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  secondary: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 6,
    borderWidth: 3,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryText: { color: palette.white, fontSize: 16, fontWeight: '900' },
  secondaryText: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.45 },
});
