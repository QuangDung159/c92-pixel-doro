import { useMemo } from 'react';
import {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type {
  PetPlaybackDriver,
  PetPlaybackDriverCallbacks,
} from './pet-playback.driver';

export const useReanimatedPetPlaybackDriver = () => {
  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleDelta = useSharedValue(0);
  const rotateDegrees = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -translateY.value],
        ),
      },
      { scale: 1 + scaleDelta.value * progress.value },
      { rotateZ: `${rotateDegrees.value * progress.value}deg` },
    ],
  }));

  const driver = useMemo<PetPlaybackDriver>(() => ({
    start: (entry, callbacks: PetPlaybackDriverCallbacks) => {
      cancelAnimation(progress);
      progress.set(0);
      translateY.set(entry.motion.translateY);
      scaleDelta.set(entry.motion.scaleDelta);
      rotateDegrees.set(entry.motion.rotateDegrees);
      const easing = Easing.inOut(Easing.quad);
      if (entry.playback === 'loop') {
        progress.set(withRepeat(
          withTiming(1, { duration: entry.cycleDurationMs, easing }),
          -1,
          true,
        ));
      } else {
        const riseDuration = Math.round(entry.cycleDurationMs * 0.45);
        progress.set(withSequence(
          withTiming(1, { duration: riseDuration, easing }),
          withTiming(
            0,
            { duration: entry.cycleDurationMs - riseDuration, easing },
            (finished) => {
              if (finished) runOnJS(callbacks.onComplete)();
            },
          ),
        ));
      }

      let cancelled = false;
      return {
        cancel: () => {
          if (cancelled) return;
          cancelled = true;
          cancelAnimation(progress);
          progress.set(0);
        },
      };
    },
  }), [progress, rotateDegrees, scaleDelta, translateY]);

  return { animatedStyle, driver };
};
