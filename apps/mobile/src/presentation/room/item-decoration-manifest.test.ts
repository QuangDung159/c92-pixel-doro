import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  resolveRoomDecorationFrame,
  roomBackdropAsset,
  roomDecorationAtlas,
  roomDecorationManifest,
} from './item-decoration-manifest';

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
    expect(roomBackdropAsset.width / roomBackdropAsset.height).toBeCloseTo(1672 / 941, 6);
    expect(roomDecorationManifest.find(({ itemId }) => itemId === 'desk-mug'))
      .toMatchObject({ xRatio: 0.035, yRatio: 0.33, sizeRatio: 0.0931, layer: 'front' });
    expect(roomDecorationManifest.find(({ itemId }) => itemId === 'tiny-plant'))
      .toMatchObject({ xRatio: 0.125, yRatio: 0.31, sizeRatio: 0.10, layer: 'front' });
    expect(roomDecorationManifest.find(({ itemId }) => itemId === 'book-stack'))
      .toMatchObject({ xRatio: 0.19, yRatio: 0.325, sizeRatio: 0.1172, layer: 'front' });
    const mug = roomDecorationManifest.find(({ itemId }) => itemId === 'desk-mug')!;
    const plant = roomDecorationManifest.find(({ itemId }) => itemId === 'tiny-plant')!;
    expect(mug.xRatio).toBeLessThan(plant.xRatio);
    expect(plant.xRatio).toBeLessThan(
      roomDecorationManifest.find(({ itemId }) => itemId === 'book-stack')!.xRatio,
    );
    expect(roomDecorationManifest.every(({ xRatio, yRatio, sizeRatio }) =>
      xRatio >= 0 && xRatio < 1 && yRatio >= 0 && yRatio < 1 &&
      sizeRatio > 0 && sizeRatio < 0.2)).toBe(true);
  });

  it('scales every frame uniformly from the measured portrait room canvas', () => {
    const mug = roomDecorationManifest[0];
    const compact = resolveRoomDecorationFrame(mug, { width: 320, height: 180 });
    const large = resolveRoomDecorationFrame(mug, { width: 640, height: 360 });
    expect(large).toEqual({
      left: compact.left * 2,
      top: compact.top * 2,
      size: compact.size * 2,
    });
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
