import type { CompanionState } from '@/presentation/components/pet-portrait';

export interface PetMotionProfile {
  readonly translateY: number;
  readonly scaleDelta: number;
  readonly rotateDegrees: number;
}

export interface PetAnimationManifestEntry {
  readonly assetId: string;
  readonly state: CompanionState;
  readonly playback: 'loop' | 'one-shot';
  readonly cycleDurationMs: number;
  readonly source: Readonly<{
    kind: 'neutral-code-pose';
    fallbackFrame: 0;
  }>;
  readonly motion: PetMotionProfile;
}

const entry = (
  state: CompanionState,
  playback: PetAnimationManifestEntry['playback'],
  cycleDurationMs: number,
  motion: PetMotionProfile,
): PetAnimationManifestEntry => Object.freeze({
  assetId: `neutral-pet-prototype-v1--${state}`,
  state,
  playback,
  cycleDurationMs,
  source: Object.freeze({ kind: 'neutral-code-pose', fallbackFrame: 0 }),
  motion: Object.freeze(motion),
});

export const petAnimationManifest: Readonly<
  Record<CompanionState, PetAnimationManifestEntry>
> = Object.freeze({
  idle: entry('idle', 'loop', 1_800, {
    translateY: 3,
    scaleDelta: 0.015,
    rotateDegrees: 0,
  }),
  working: entry('working', 'loop', 1_000, {
    translateY: 2,
    scaleDelta: 0.01,
    rotateDegrees: 1,
  }),
  breaking: entry('breaking', 'loop', 2_200, {
    translateY: 2,
    scaleDelta: 0.02,
    rotateDegrees: 0,
  }),
  celebrating: entry('celebrating', 'one-shot', 650, {
    translateY: 12,
    scaleDelta: 0.08,
    rotateDegrees: 4,
  }),
  bugged: entry('bugged', 'one-shot', 450, {
    translateY: 3,
    scaleDelta: 0.035,
    rotateDegrees: 6,
  }),
});
