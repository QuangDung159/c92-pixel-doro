import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  PET_SPRITE_DISPLAY_SIZE,
  type CompanionState,
} from '@/presentation/components/pet-portrait';

import { petAnimationManifest } from './pet-animation-manifest';

export const PetSpritePlayback = ({ state }: { readonly state: CompanionState }) => {
  const entry = petAnimationManifest[state];
  const clipTop = entry.source.artifactClipTop * PET_SPRITE_DISPLAY_SIZE /
    entry.source.frameHeight;
  const frame = useSharedValue<number>(entry.source.fallbackFrame);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: -Math.floor(frame.value) * PET_SPRITE_DISPLAY_SIZE,
    }],
  }));

  useEffect(() => {
    cancelAnimation(frame);
    frame.set(entry.source.fallbackFrame);
    const sequence = withTiming(entry.source.frameCount - 0.001, {
      duration: entry.cycleDurationMs,
      easing: Easing.linear,
    });
    frame.set(entry.playback === 'loop'
      ? withRepeat(sequence, -1, false)
      : sequence);
    return () => {
      cancelAnimation(frame);
      frame.set(entry.source.fallbackFrame);
    };
  }, [entry, frame]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.frame}
      testID={`pet-sprite-${state}-playback`}
    >
      <View style={clipTop === 0 ? styles.fullFrame : {
        height: PET_SPRITE_DISPLAY_SIZE - clipTop,
        overflow: 'hidden',
        top: clipTop,
        width: PET_SPRITE_DISPLAY_SIZE,
      }}>
        <Animated.Image
        resizeMode="stretch"
        source={entry.source.image}
        style={[styles.sheet, clipTop === 0 ? undefined : { top: -clipTop }, animatedStyle]}
        />
      </View>
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
  fullFrame: {
    height: PET_SPRITE_DISPLAY_SIZE,
    width: PET_SPRITE_DISPLAY_SIZE,
  },
});
