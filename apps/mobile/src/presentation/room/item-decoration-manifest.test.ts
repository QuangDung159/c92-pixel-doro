import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { roomBackdropAsset, roomDecorationAtlas, roomDecorationManifest } from './item-decoration-manifest';

describe('roomDecorationManifest', () => {
  it('covers the twelve approved catalog identities exactly once with bounded atlas cells', () => {
    const expected = [
      'desk-mug', 'tiny-plant', 'book-stack', 'desk-lamp', 'wall-calendar',
      'floor-cushion', 'small-rug', 'wall-poster', 'bookshelf', 'standing-lamp',
      'armchair', 'window-view',
    ];
    expect(roomDecorationManifest.map(({ itemId }) => itemId)).toEqual(expected);
    expect(new Set(roomDecorationManifest.map(({ itemId }) => itemId)).size).toBe(12);
    expect(roomDecorationManifest.every(({ atlasColumn, atlasRow }) =>
      atlasColumn < roomDecorationAtlas.columns && atlasRow < roomDecorationAtlas.rows)).toBe(true);
    expect(roomDecorationAtlas.sha256).toHaveLength(64);
  });

  it('binds runtime metadata to the promoted approved files', () => {
    const digest = (path: string) => createHash('sha256')
      .update(readFileSync(resolve(process.cwd(), path))).digest('hex');
    expect(digest('apps/mobile/assets/sprites/items/room-v1/room-decoration-atlas-v1.png'))
      .toBe(roomDecorationAtlas.sha256);
    expect(digest('apps/mobile/assets/sprites/rooms/pet-room-v1.png'))
      .toBe(roomBackdropAsset.sha256);
  });
});
