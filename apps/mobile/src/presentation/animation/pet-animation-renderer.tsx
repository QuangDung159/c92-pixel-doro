import { useCallback, useEffect, useRef, useState } from 'react';
import Animated from 'react-native-reanimated';

import { PetPortrait, type CompanionState } from '@/presentation/components/pet-portrait';
import { NeutralPetPlaceholder } from '@/presentation/components/neutral-pet-placeholder';
import { usePetVisualVisibility } from '@/presentation/hooks/use-pet-visual-visibility';
import { usePetVisualDiagnostics } from '@/presentation/providers/mobile-application-context';
import { useReducedMotionPreference } from '@/presentation/providers/reduced-motion-context';

import { resolvePetRenderPlan } from './pet-asset-catalog';
import { usePetAssetReviewScenario } from './pet-asset-review-context';
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
  const reduceMotion = useReducedMotionPreference();
  const reviewScenario = usePetAssetReviewScenario();
  const recordDiagnostic = usePetVisualDiagnostics();
  const { animatedStyle, driver } = useReanimatedPetPlaybackDriver();
  const controllerRef = useRef<PetPlaybackController | null>(null);
  const reportedDiagnosticKey = useRef<string | null>(null);
  const playbackKey = `${playbackId}:${state}`;
  const [failedPlaybackKey, setFailedPlaybackKey] = useState<string | null>(null);
  controllerRef.current ??= new PetPlaybackController(driver);
  const plan = resolvePetRenderPlan({
    state,
    wantsPlayback: isVisible && !reduceMotion && visualMode !== 'still',
    playbackFailed: failedPlaybackKey === playbackKey,
    reviewScenario,
  });
  const poseState = plan.poseState ?? state;

  const handlePlaybackFailure = useCallback(() => {
    setFailedPlaybackKey(playbackKey);
    onPlaybackFailure();
  }, [onPlaybackFailure, playbackKey]);

  useEffect(() => {
    controllerRef.current?.reconcile({
      playbackId,
      entry: petAnimationManifest[poseState],
      isVisible,
      reduceMotion,
      visualMode: plan.layer === 'state_playback' ? visualMode : 'still',
    }, {
      onComplete: onPlaybackComplete,
      onFailure: handlePlaybackFailure,
    });
  }, [
    handlePlaybackFailure,
    isVisible,
    onPlaybackComplete,
    playbackId,
    plan.layer,
    poseState,
    reduceMotion,
    visualMode,
  ]);

  useEffect(() => {
    if (plan.diagnosticReason === undefined) return;
    const diagnosticKey = `${playbackKey}:${plan.layer}:${plan.diagnosticReason}`;
    if (reportedDiagnosticKey.current === diagnosticKey) return;
    reportedDiagnosticKey.current = diagnosticKey;
    recordDiagnostic({
      eventName: 'pet_visual_fallback',
      state,
      fallbackLayer: plan.layer === 'state_playback'
        ? 'state_still'
        : plan.layer,
      reasonCode: plan.diagnosticReason,
    });
  }, [plan.diagnosticReason, plan.layer, playbackKey, recordDiagnostic, state]);

  useEffect(() => () => controllerRef.current?.dispose(), []);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={animatedStyle}
    >
      {plan.layer === 'neutral_placeholder'
        ? <NeutralPetPlaceholder />
        : <PetPortrait state={poseState} />}
    </Animated.View>
  );
};
