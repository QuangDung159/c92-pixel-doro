import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { petAnimationManifest } from './pet-animation-manifest';

describe('petAnimationManifest', () => {
  it('provides one typed bundled Cat entry for every Pet state', () => {
    expect(Object.keys(petAnimationManifest)).toEqual([
      'idle',
      'working',
      'breaking',
      'celebrating',
      'bugged',
    ]);
    expect(Object.values(petAnimationManifest).every(
      (entry) => entry.petId === 'cat-dev' &&
        entry.source.kind === 'bundled-sprite-sheet',
    )).toBe(true);
  });

  it('keeps every production sheet immutable, RGBA, and exactly six square frames', () => {
    for (const entry of Object.values(petAnimationManifest)) {
      const file = readFileSync(resolve(
        process.cwd(),
        'apps/mobile/assets/sprites/pets/cat-dev',
        entry.source.fileName,
      ));
      expect(file.subarray(1, 4).toString()).toBe('PNG');
      expect(file.readUInt32BE(16)).toBe(1_374);
      expect(file.readUInt32BE(20)).toBe(229);
      expect(file[25]).toBe(6);
      expect(entry.source.frameWidth * entry.source.frameCount).toBe(1_374);
      expect(createHash('sha256').update(file).digest('hex')).toBe(
        entry.source.sha256,
      );
    }
  });

  it('uses loops only for base states and one-shots only for terminal states', () => {
    expect(petAnimationManifest.idle.playback).toBe('loop');
    expect(petAnimationManifest.working.playback).toBe('loop');
    expect(petAnimationManifest.breaking.playback).toBe('loop');
    expect(petAnimationManifest.celebrating.playback).toBe('one-shot');
    expect(petAnimationManifest.bugged.playback).toBe('one-shot');
  });
});
