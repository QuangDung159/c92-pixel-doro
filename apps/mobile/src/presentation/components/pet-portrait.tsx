import { StyleSheet, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export type CompanionState =
  | 'idle'
  | 'working'
  | 'breaking'
  | 'celebrating'
  | 'bugged';

export const PetPortrait = ({ state }: { readonly state: CompanionState }) => {
  const working = state === 'working';
  const breaking = state === 'breaking';
  const celebrating = state === 'celebrating';
  const bugged = state === 'bugged';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.glow,
        working && styles.glowWorking,
        breaking && styles.glowBreaking,
        celebrating && styles.gold,
        bugged && styles.danger,
      ]}
    >
      <View
        style={[
          styles.head,
          working && styles.headWorking,
          breaking && styles.headBreaking,
          celebrating && styles.headCelebrating,
          bugged && styles.headBugged,
        ]}
      >
        <View style={styles.eyes}>
          <View
            style={[
              styles.eye,
              working && styles.eyeWorking,
              breaking && styles.eyeBreaking,
              celebrating && styles.eyeCelebrating,
              bugged && styles.eyeBugged,
            ]}
          />
          <View
            style={[
              styles.eye,
              working && styles.eyeWorking,
              breaking && styles.eyeBreaking,
              celebrating && styles.eyeCelebrating,
              bugged && styles.eyeBugged,
            ]}
          />
        </View>
        <View
          style={[
            styles.mouth,
            breaking && styles.mouthBreaking,
            celebrating && styles.mouthCelebrating,
            bugged && styles.mouthBugged,
          ]}
        />
      </View>
      <View
        style={[
          styles.body,
          working && styles.bodyWorking,
          breaking && styles.bodyBreaking,
        ]}
      />
      {working ? <View style={styles.focusDesk} testID="pet-working-desk" /> : null}
      {breaking ? (
        <View style={styles.restCushion} testID="pet-breaking-cushion" />
      ) : null}
      {celebrating ? (
        <View style={styles.celebrationSparks} testID="pet-celebration-sparks">
          <View style={styles.spark} />
          <View style={styles.spark} />
          <View style={styles.spark} />
        </View>
      ) : null}
      {bugged ? (
        <View style={styles.glitchMarks} testID="pet-bugged-glitches">
          <View style={styles.glitchLong} />
          <View style={styles.glitchShort} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    alignItems: 'center',
    backgroundColor: '#C6DB83',
    borderRadius: 60,
    height: 130,
    justifyContent: 'center',
    width: 130,
  },
  glowWorking: { backgroundColor: '#B9D9DE' },
  glowBreaking: { backgroundColor: '#E9D9A7' },
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
  headWorking: { transform: [{ translateX: -5 }, { rotate: '-4deg' }] },
  headBreaking: { transform: [{ translateY: 8 }] },
  headCelebrating: { transform: [{ translateY: -7 }] },
  headBugged: { transform: [{ translateX: 5 }, { rotate: '5deg' }] },
  eyes: { flexDirection: 'row', gap: 18 },
  eye: { backgroundColor: palette.accentGold, height: 9, width: 9 },
  eyeWorking: { height: 6, width: 13 },
  eyeBreaking: { borderRadius: 2, height: 3, width: 15 },
  eyeCelebrating: { height: 11, width: 11 },
  eyeBugged: { height: 5, width: 13 },
  mouth: { backgroundColor: palette.white, height: 5, marginTop: 11, width: 18 },
  mouthBreaking: { marginTop: 9, width: 10 },
  mouthCelebrating: { height: 7, width: 25 },
  mouthBugged: { transform: [{ rotate: '-8deg' }], width: 12 },
  body: {
    backgroundColor: palette.accentDark,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    height: 42,
    width: 52,
  },
  bodyWorking: { transform: [{ translateX: -2 }], width: 58 },
  bodyBreaking: {
    borderRadius: 8,
    height: 32,
    transform: [{ translateY: 8 }],
    width: 62,
  },
  focusDesk: {
    backgroundColor: palette.accentBlue,
    borderColor: palette.border,
    borderRadius: 3,
    borderWidth: 2,
    bottom: 17,
    height: 10,
    position: 'absolute',
    right: 11,
    transform: [{ rotate: '-5deg' }],
    width: 76,
  },
  restCushion: {
    backgroundColor: palette.accentGold,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 2,
    bottom: 9,
    height: 18,
    position: 'absolute',
    width: 88,
  },
  celebrationSparks: {
    flexDirection: 'row',
    gap: 20,
    position: 'absolute',
    top: 8,
  },
  spark: {
    backgroundColor: palette.white,
    height: 9,
    transform: [{ rotate: '45deg' }],
    width: 9,
  },
  glitchMarks: {
    gap: 6,
    left: 7,
    position: 'absolute',
    top: 19,
  },
  glitchLong: { backgroundColor: palette.accentRed, height: 5, width: 37 },
  glitchShort: { backgroundColor: palette.white, height: 4, width: 23 },
});
