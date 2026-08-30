import { useEffect, useRef } from 'react';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { PetPortrait, type CompanionState } from '@/presentation/components/pet-portrait';
import { usePetVisualVisibility } from '@/presentation/hooks/use-pet-visual-visibility';

import { petAnimationManifest } from './pet-animation-manifest';
import { PetPlaybackController } from './pet-playback.controller';
import { useReanimatedPetPlaybackDriver } from './use-reanimated-pet-playback-driver';

export interface PetAnimationRendererProps {
  readonly state: CompanionState;
  readonly playbackId: string;
  readonly visualMode: 'loop' | 'one-shot' | 'still';
  readonly onPlaybackComplete?: () => void;
  readonly onPlaybackFailure?: () => void;
}

export const PetAnimationRenderer = ({
  state,
  playbackId,
  visualMode,
  onPlaybackComplete = () => undefined,
  onPlaybackFailure = () => undefined,
}: PetAnimationRendererProps) => {
  const isVisible = usePetVisualVisibility();
  const reduceMotion = useReducedMotion();
  const { animatedStyle, driver } = useReanimatedPetPlaybackDriver();
  const controllerRef = useRef<PetPlaybackController | null>(null);
  controllerRef.current ??= new PetPlaybackController(driver);

  useEffect(() => {
    controllerRef.current?.reconcile({
      playbackId,
      entry: petAnimationManifest[state],
      isVisible,
      reduceMotion,
      visualMode,
    }, {
      onComplete: onPlaybackComplete,
      onFailure: onPlaybackFailure,
    });
  }, [
    isVisible,
    onPlaybackComplete,
    onPlaybackFailure,
    playbackId,
    reduceMotion,
    state,
    visualMode,
  ]);

  useEffect(() => () => controllerRef.current?.dispose(), []);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={animatedStyle}
    >
      <PetPortrait state={state} />
    </Animated.View>
  );
};
