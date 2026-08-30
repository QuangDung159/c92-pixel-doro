import type { PetAnimationManifestEntry } from './pet-animation-manifest';

export interface PetPlaybackDriverCallbacks {
  readonly onComplete: () => void;
  readonly onFailure: () => void;
}

export interface PetPlaybackHandle {
  cancel(): void;
}

export interface PetPlaybackDriver {
  start(
    entry: PetAnimationManifestEntry,
    callbacks: PetPlaybackDriverCallbacks,
  ): PetPlaybackHandle;
}

export interface PetPlaybackReconcileInput {
  readonly playbackId: string;
  readonly entry: PetAnimationManifestEntry;
  readonly isVisible: boolean;
  readonly reduceMotion: boolean;
  readonly visualMode: 'loop' | 'one-shot' | 'still';
}
