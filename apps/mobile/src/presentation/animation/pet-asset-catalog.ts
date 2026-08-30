import type {
  PetVisualFallbackLayer,
  PetVisualFallbackReason,
} from '@/application';
import type { CompanionState } from '@/presentation/components/pet-portrait';

import type { PetAssetReviewScenario } from './pet-asset-review-context';

export type PetRenderPlan = Readonly<{
  layer: 'state_playback' | PetVisualFallbackLayer;
  poseState: CompanionState | null;
  diagnosticReason?: PetVisualFallbackReason;
}>;

export interface ResolvePetRenderPlanInput {
  readonly state: CompanionState;
  readonly wantsPlayback: boolean;
  readonly playbackFailed: boolean;
  readonly reviewScenario: PetAssetReviewScenario;
}

export const resolvePetRenderPlan = (
  input: ResolvePetRenderPlanInput,
): PetRenderPlan => {
  const playbackAvailable = input.reviewScenario === 'normal';
  const stateFrameAvailable = input.reviewScenario === 'normal' ||
    input.reviewScenario === 'playback_failure';
  const idleFrameAvailable = input.reviewScenario !== 'all_art_missing';

  if (input.wantsPlayback && playbackAvailable && !input.playbackFailed) {
    return Object.freeze({ layer: 'state_playback', poseState: input.state });
  }
  if (stateFrameAvailable) {
    return Object.freeze({
      layer: 'state_still',
      poseState: input.state,
      ...(input.playbackFailed
        ? { diagnosticReason: 'driver_failure' as const }
        : input.wantsPlayback && !playbackAvailable
          ? { diagnosticReason: 'playback_unavailable' as const }
          : {}),
    });
  }
  if (idleFrameAvailable) {
    return Object.freeze({
      layer: 'idle_still',
      poseState: 'idle',
      diagnosticReason: 'state_frame_unavailable',
    });
  }
  return Object.freeze({
    layer: 'neutral_placeholder',
    poseState: null,
    diagnosticReason: 'all_art_unavailable',
  });
};
