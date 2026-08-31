import { describe, expect, it } from 'vitest';

import { resolvePetRenderPlan } from './pet-asset-catalog';
import { parsePetAssetReviewScenario } from './pet-asset-review-context';

const input = (overrides = {}) => ({
  state: 'working' as const,
  wantsPlayback: true,
  playbackFailed: false,
  reviewScenario: 'normal' as const,
  ...overrides,
});

describe('resolvePetRenderPlan', () => {
  it('enables only explicit development review scenarios', () => {
    expect(parsePetAssetReviewScenario('all_art_missing', true)).toBe('all_art_missing');
    expect(parsePetAssetReviewScenario('all_art_missing', false)).toBe('normal');
    expect(parsePetAssetReviewScenario('unknown', true)).toBe('normal');
  });

  it('uses playback, reduced-motion still, then exact deterministic fallback layers', () => {
    expect(resolvePetRenderPlan(input())).toEqual({
      layer: 'state_playback',
      poseState: 'working',
    });
    expect(resolvePetRenderPlan(input({ wantsPlayback: false }))).toEqual({
      layer: 'state_still',
      poseState: 'working',
    });
    expect(resolvePetRenderPlan(input({ reviewScenario: 'playback_failure' }))).toEqual({
      layer: 'state_still',
      poseState: 'working',
      diagnosticReason: 'playback_unavailable',
    });
    expect(resolvePetRenderPlan(input({ reviewScenario: 'state_frame_missing' }))).toEqual({
      layer: 'idle_still',
      poseState: 'idle',
      diagnosticReason: 'state_frame_unavailable',
    });
    expect(resolvePetRenderPlan(input({ reviewScenario: 'all_art_missing' }))).toEqual({
      layer: 'neutral_placeholder',
      poseState: null,
      diagnosticReason: 'all_art_unavailable',
    });
  });

  it('falls from a runtime driver failure to the same-state still', () => {
    expect(resolvePetRenderPlan(input({ playbackFailed: true }))).toEqual({
      layer: 'state_still',
      poseState: 'working',
      diagnosticReason: 'driver_failure',
    });
  });
});
