import { StyleSheet, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export type CompanionState =
  | 'idle'
  | 'working'
  | 'breaking'
  | 'celebrating'
  | 'bugged';

export const PetPortrait = ({ state }: { readonly state: CompanionState }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[
      styles.glow,
      state === 'celebrating' && styles.gold,
      state === 'bugged' && styles.danger,
    ]}
  >
    <View style={styles.head}>
      <View style={styles.eyes}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={styles.mouth} />
    </View>
    <View style={styles.body} />
  </View>
);

const styles = StyleSheet.create({
  glow: {
    alignItems: 'center',
    backgroundColor: '#C6DB83',
    borderRadius: 60,
    height: 130,
    justifyContent: 'center',
    width: 130,
  },
  gold: { backgroundColor: palette.accentGold },
  danger: { backgroundColor: '#E99A82' },
  head: {
    alignItems: 'center',
    backgroundColor: palette.textPrimary,
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    width: 72,
  },
  eyes: { flexDirection: 'row', gap: 18 },
  eye: { backgroundColor: palette.accentGold, height: 9, width: 9 },
  mouth: { backgroundColor: palette.white, height: 5, marginTop: 11, width: 18 },
  body: {
    backgroundColor: palette.accentDark,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    height: 42,
    width: 52,
  },
});
