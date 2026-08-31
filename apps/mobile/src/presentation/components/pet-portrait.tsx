import { Image, StyleSheet, View } from 'react-native';

import { petAnimationManifest } from '@/presentation/animation/pet-animation-manifest';

export type CompanionState =
  | 'idle'
  | 'working'
  | 'breaking'
  | 'celebrating'
  | 'bugged';

export const PET_SPRITE_DISPLAY_SIZE = 154;

export const PetPortrait = ({ state }: { readonly state: CompanionState }) => {
  const entry = petAnimationManifest[state];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.frame}
      testID={`pet-sprite-${state}-still`}
    >
      <Image
        resizeMode="stretch"
        source={entry.source.image}
        style={styles.sheet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    height: PET_SPRITE_DISPLAY_SIZE,
    overflow: 'hidden',
    width: PET_SPRITE_DISPLAY_SIZE,
  },
  sheet: {
    height: PET_SPRITE_DISPLAY_SIZE,
    width: PET_SPRITE_DISPLAY_SIZE * 6,
  },
});
