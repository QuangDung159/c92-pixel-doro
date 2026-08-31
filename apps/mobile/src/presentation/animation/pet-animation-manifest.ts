import type { ImageSourcePropType } from 'react-native';

import breakingSheet from '@/assets/sprites/pets/cat-dev/cat-dev--breaking--sheet.png';
import buggedSheet from '@/assets/sprites/pets/cat-dev/cat-dev--bugged--sheet.png';
import celebratingSheet from '@/assets/sprites/pets/cat-dev/cat-dev--celebrating--sheet.png';
import idleSheet from '@/assets/sprites/pets/cat-dev/cat-dev--idle--sheet.png';
import workingSheet from '@/assets/sprites/pets/cat-dev/cat-dev--working--sheet.png';
import type { CompanionState } from '@/presentation/components/pet-portrait';

export interface PetMotionProfile {
  readonly translateY: number;
  readonly scaleDelta: number;
  readonly rotateDegrees: number;
}

export interface PetSpriteSheetSource {
  readonly kind: 'bundled-sprite-sheet';
  readonly image: ImageSourcePropType;
  readonly fileName: string;
  readonly sha256: string;
  readonly frameCount: 6;
  readonly frameWidth: 229;
  readonly frameHeight: 229;
  readonly fallbackFrame: 0;
}

export interface PetAnimationManifestEntry {
  readonly assetId: string;
  readonly petId: 'cat-dev';
  readonly state: CompanionState;
  readonly playback: 'loop' | 'one-shot';
  readonly cycleDurationMs: number;
  readonly source: Readonly<PetSpriteSheetSource>;
  readonly motion: PetMotionProfile;
}

const entry = (
  state: CompanionState,
  image: ImageSourcePropType,
  sha256: string,
  playback: PetAnimationManifestEntry['playback'],
  cycleDurationMs: number,
  motion: PetMotionProfile,
): PetAnimationManifestEntry => Object.freeze({
  assetId: `cat-dev--${state}--sheet-v1`,
  petId: 'cat-dev',
  state,
  playback,
  cycleDurationMs,
  source: Object.freeze({
    kind: 'bundled-sprite-sheet',
    image,
    fileName: `cat-dev--${state}--sheet.png`,
    sha256,
    frameCount: 6,
    frameWidth: 229,
    frameHeight: 229,
    fallbackFrame: 0,
  }),
  motion: Object.freeze(motion),
});

export const petAnimationManifest: Readonly<
  Record<CompanionState, PetAnimationManifestEntry>
> = Object.freeze({
  idle: entry(
    'idle', idleSheet,
    '645731c476da1db47864e8fc4174ee753b06d74df52f0894c3aeea97ed27bc33',
    'loop', 1_800,
    { translateY: 3, scaleDelta: 0.015, rotateDegrees: 0 },
  ),
  working: entry(
    'working', workingSheet,
    '90ac46ec44222aa27a9f3ef9d22e62e7e6a5e9e4a34fbfab193741677632ef68',
    'loop', 1_000,
    { translateY: 2, scaleDelta: 0.01, rotateDegrees: 1 },
  ),
  breaking: entry(
    'breaking', breakingSheet,
    'edce5ac5f22fd0a4bb43c4757daa04baeaff9bb7d995f678b6340f23d76d5c94',
    'loop', 2_200,
    { translateY: 2, scaleDelta: 0.02, rotateDegrees: 0 },
  ),
  celebrating: entry(
    'celebrating', celebratingSheet,
    'c8c39a70a686e77fc90030bbad25ecc10586fb3e342a9051d40caa9f9d30bc74',
    'one-shot', 650,
    { translateY: 12, scaleDelta: 0.08, rotateDegrees: 4 },
  ),
  bugged: entry(
    'bugged', buggedSheet,
    '943f51b26e5fbe406b3dcc204087334d39f4524b1ba9bd1e07ac31a49edbe66a',
    'one-shot', 450,
    { translateY: 3, scaleDelta: 0.035, rotateDegrees: 6 },
  ),
});
