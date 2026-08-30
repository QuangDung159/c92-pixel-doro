import { StyleSheet, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export const NeutralPetPlaceholder = () => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={styles.frame}
    testID="neutral-pet-placeholder"
  >
    <View style={styles.head}>
      <View style={styles.eyeRow}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={styles.mouth} />
    </View>
    <View style={styles.body} />
  </View>
);

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 60,
    borderStyle: 'dashed',
    borderWidth: 3,
    height: 130,
    justifyContent: 'center',
    width: 130,
  },
  head: {
    alignItems: 'center',
    borderColor: palette.textSecondary,
    borderRadius: 7,
    borderWidth: 3,
    height: 56,
    justifyContent: 'center',
    width: 70,
  },
  eyeRow: { flexDirection: 'row', gap: 17 },
  eye: { backgroundColor: palette.textSecondary, height: 7, width: 7 },
  mouth: { backgroundColor: palette.textSecondary, height: 4, marginTop: 10, width: 17 },
  body: { backgroundColor: palette.textSecondary, height: 31, opacity: 0.5, width: 48 },
});
