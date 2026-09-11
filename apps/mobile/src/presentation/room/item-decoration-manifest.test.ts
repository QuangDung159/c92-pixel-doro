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
      .toMatchObject({
        sourceBounds: { x: 93, y: 147, width: 199, height: 162 },
        target: { leftRatio: 0.020, topRatio: 0.227, widthRatio: 0.064, heightRatio: 0.046 },
        layer: 'front',
        zOrder: 20,
      });
    expect(roomDecorationManifest.find(({ itemId }) => itemId === 'tiny-plant'))
      .toMatchObject({
        sourceBounds: { x: 70, y: 99, width: 198, height: 226 },
        target: { leftRatio: 0.043, topRatio: 0.187, widthRatio: 0.064, heightRatio: 0.078 },
        layer: 'front',
        zOrder: 10,
      });
    expect(roomDecorationManifest.find(({ itemId }) => itemId === 'book-stack'))
      .toMatchObject({
        sourceBounds: { x: 30, y: 146, width: 277, height: 176 },
        target: { leftRatio: 0.109, topRatio: 0.212, widthRatio: 0.097, heightRatio: 0.048 },
        layer: 'front',
      });
    const mug = roomDecorationManifest.find(({ itemId }) => itemId === 'desk-mug')!;
    const plant = roomDecorationManifest.find(({ itemId }) => itemId === 'tiny-plant')!;
    expect(plant.zOrder).toBeLessThan(mug.zOrder);
    expect(mug.target.leftRatio).toBeLessThan(plant.target.leftRatio);
    expect(plant.target.leftRatio).toBeLessThan(
      roomDecorationManifest.find(({ itemId }) => itemId === 'book-stack')!.target.leftRatio,
    );
    expect(roomDecorationManifest.every(({ sourceBounds, target }) =>
      sourceBounds.x >= 0 && sourceBounds.y >= 0 &&
      sourceBounds.width > 0 && sourceBounds.height > 0 &&
      sourceBounds.x + sourceBounds.width <= 362 &&
      sourceBounds.y + sourceBounds.height <= 362 &&
      target.leftRatio >= 0 && target.topRatio >= 0 &&
      target.widthRatio > 0 && target.heightRatio > 0 &&
      target.leftRatio + target.widthRatio <= 1 &&
      (target.topRatio + target.heightRatio) * roomBackdropAsset.width <=
        roomBackdropAsset.height)).toBe(true);
  });

  it('maps the visible sprite bounds onto the approved reference target', () => {
    const room = { width: 640, height: 360 };
    for (const item of roomDecorationManifest) {
      const frame = resolveRoomDecorationFrame(item, room);
      expect(frame.left).toBeCloseTo(room.width * item.target.leftRatio, 6);
      expect(frame.top).toBeCloseTo(room.width * item.target.topRatio, 6);
      expect(frame.width).toBeCloseTo(room.width * item.target.widthRatio, 6);
      expect(frame.height).toBeCloseTo(room.width * item.target.heightRatio, 6);
    }
  });

  it('scales every frame uniformly from the measured portrait room canvas', () => {
    const mug = roomDecorationManifest[0];
    const compact = resolveRoomDecorationFrame(mug, { width: 320, height: 180 });
    const large = resolveRoomDecorationFrame(mug, { width: 640, height: 360 });
    expect(large).toEqual({
      left: compact.left * 2,
      top: compact.top * 2,
      width: compact.width * 2,
      height: compact.height * 2,
      atlasCellWidth: compact.atlasCellWidth * 2,
      atlasCellHeight: compact.atlasCellHeight * 2,
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
