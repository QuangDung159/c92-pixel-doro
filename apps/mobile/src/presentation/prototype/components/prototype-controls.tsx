import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export const PrototypeBadge = () => (
  <View
    accessibilityLabel="Bản mẫu giao diện, dữ liệu không được lưu"
    style={styles.badge}
  >
    <View style={styles.liveDot} />
    <Text style={styles.badgeText}>PROTOTYPE · FAKE DATA</Text>
  </View>
);

export const PrototypeControls = ({ children }: PropsWithChildren) => {
  const visible = typeof __DEV__ === 'undefined' || __DEV__;
  if (!visible) return null;

  return (
    <View accessibilityLabel="Điều khiển bản mẫu" style={styles.controls}>
      <Text style={styles.title}>PROTOTYPE CONTROLS</Text>
      <Text style={styles.copy}>Chuyển state giả để review. Không tạo dữ liệu thật.</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
};

export const ControlButton = ({
  label,
  onPress,
  accessibilityLabel = label,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
}) => (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.textPrimary,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: { backgroundColor: palette.accentGold, height: 7, width: 7 },
  badgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  controls: {
    backgroundColor: '#DDE8EE',
    borderColor: palette.accentBlue,
    borderRadius: 6,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 8,
    padding: 14,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  copy: { color: palette.textSecondary, fontSize: 12, lineHeight: 17 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    backgroundColor: palette.white,
    borderColor: palette.accentBlue,
    borderRadius: 4,
    borderWidth: 2,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  buttonText: { color: palette.textPrimary, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ translateY: 2 }] },
});
