import { describe, expect, it } from 'vitest';

import { petAnimationManifest } from './pet-animation-manifest';

describe('petAnimationManifest', () => {
  it('provides one typed local prototype entry for every Pet state', () => {
    expect(Object.keys(petAnimationManifest)).toEqual([
      'idle',
      'working',
      'breaking',
      'celebrating',
      'bugged',
    ]);
    expect(Object.values(petAnimationManifest).every(
      (entry) => entry.source.kind === 'neutral-code-pose',
    )).toBe(true);
  });

  it('uses loops only for base states and one-shots only for terminal states', () => {
    expect(petAnimationManifest.idle.playback).toBe('loop');
    expect(petAnimationManifest.working.playback).toBe('loop');
    expect(petAnimationManifest.breaking.playback).toBe('loop');
    expect(petAnimationManifest.celebrating.playback).toBe('one-shot');
    expect(petAnimationManifest.bugged.playback).toBe('one-shot');
  });
});
