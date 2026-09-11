import type { ImageSourcePropType } from 'react-native';

import atlas from '@/assets/sprites/items/room-v1/room-decoration-atlas-v1.png';
import backdrop from '@/assets/sprites/rooms/pet-room-v1.png';

export const roomBackdropAsset = Object.freeze({
  source: backdrop,
  width: 1672,
  height: 941,
  sha256: 'd22ae4d4198a8aa15a50ef442eff337f83db6c7d9af50f9b235fe8e5a9ed06c5',
});

export type RoomDecorationItemId =
  | 'desk-mug' | 'tiny-plant' | 'book-stack' | 'desk-lamp'
  | 'wall-calendar' | 'floor-cushion' | 'small-rug' | 'wall-poster'
  | 'bookshelf' | 'standing-lamp' | 'armchair' | 'window-view';

export interface RoomDecorationManifestEntry {
  readonly itemId: RoomDecorationItemId;
  readonly source: ImageSourcePropType;
  readonly atlasColumn: 0 | 1 | 2 | 3;
  readonly atlasRow: 0 | 1 | 2;
  readonly sourceBounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly target: {
    /** All ratios use the approved composition width as their shared scale axis. */
    readonly leftRatio: number;
    readonly topRatio: number;
    readonly widthRatio: number;
    readonly heightRatio: number;
  };
  readonly layer: 'back' | 'front';
  readonly zOrder: number;
}

export interface RoomDecorationFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly atlasCellWidth: number;
  readonly atlasCellHeight: number;
}

export const resolveRoomDecorationFrame = (
  item: RoomDecorationManifestEntry,
  room: { readonly width: number; readonly height: number },
): RoomDecorationFrame => {
  const scaleX = room.width * item.target.widthRatio / item.sourceBounds.width;
  const scaleY = room.width * item.target.heightRatio / item.sourceBounds.height;
  return Object.freeze({
    left: room.width * item.target.leftRatio,
    top: room.width * item.target.topRatio,
    width: item.sourceBounds.width * scaleX,
    height: item.sourceBounds.height * scaleY,
    atlasCellWidth: 362 * scaleX,
    atlasCellHeight: 362 * scaleY,
  });
};

const entry = (
  itemId: RoomDecorationItemId,
  atlasColumn: 0 | 1 | 2 | 3,
  atlasRow: 0 | 1 | 2,
  sourceBounds: RoomDecorationManifestEntry['sourceBounds'],
  target: RoomDecorationManifestEntry['target'],
  layer: 'back' | 'front',
  zOrder = 0,
): RoomDecorationManifestEntry => Object.freeze({
  itemId, source: atlas, atlasColumn, atlasRow, sourceBounds, target, layer, zOrder,
});

export const roomDecorationAtlas = Object.freeze({
  width: 1448,
  height: 1086,
  columns: 4,
  rows: 3,
  sha256: 'f2c90f8818602e74aa70313754a87b2223f5924c9635f43bea189d4119788650',
});

export const roomDecorationManifest = Object.freeze([
  entry('desk-mug', 0, 0, { x: 93, y: 147, width: 199, height: 162 },
    { leftRatio: 0.020, topRatio: 0.227, widthRatio: 0.064, heightRatio: 0.046 }, 'front', 20),
  entry('tiny-plant', 1, 0, { x: 70, y: 99, width: 198, height: 226 },
    { leftRatio: 0.043, topRatio: 0.187, widthRatio: 0.064, heightRatio: 0.078 }, 'front', 10),
  entry('book-stack', 2, 0, { x: 30, y: 146, width: 277, height: 176 },
    { leftRatio: 0.109, topRatio: 0.212, widthRatio: 0.097, heightRatio: 0.048 }, 'front'),
  entry('desk-lamp', 3, 0, { x: 55, y: 94, width: 246, height: 232 },
    { leftRatio: 0.163, topRatio: 0.136, widthRatio: 0.112, heightRatio: 0.124 }, 'back'),
  entry('wall-calendar', 0, 1, { x: 81, y: 40, width: 207, height: 249 },
    { leftRatio: 0.066, topRatio: 0.029, widthRatio: 0.094, heightRatio: 0.143 }, 'back'),
  entry('floor-cushion', 1, 1, { x: 39, y: 95, width: 277, height: 177 },
    { leftRatio: 0.224, topRatio: 0.374, widthRatio: 0.147, heightRatio: 0.078 }, 'front'),
  entry('small-rug', 2, 1, { x: 0, y: 98, width: 362, height: 159 },
    { leftRatio: 0.362, topRatio: 0.380, widthRatio: 0.334, heightRatio: 0.071 }, 'back'),
  entry('wall-poster', 3, 1, { x: 73, y: 13, width: 211, height: 286 },
    { leftRatio: 0.225, topRatio: 0.047, widthRatio: 0.107, heightRatio: 0.147 }, 'back'),
  entry('bookshelf', 0, 2, { x: 33, y: 0, width: 299, height: 300 },
    { leftRatio: 0.660, topRatio: 0.048, widthRatio: 0.199, heightRatio: 0.316 }, 'back'),
  entry('standing-lamp', 1, 2, { x: 95, y: 0, width: 160, height: 316 },
    { leftRatio: 0.873, topRatio: 0.077, widthRatio: 0.106, heightRatio: 0.361 }, 'back'),
  entry('armchair', 2, 2, { x: 0, y: 20, width: 322, height: 294 },
    { leftRatio: 0.725, topRatio: 0.214, widthRatio: 0.215, heightRatio: 0.219 }, 'back'),
  entry('window-view', 3, 2, { x: 5, y: 10, width: 325, height: 288 },
    { leftRatio: 0.349, topRatio: 0.009, widthRatio: 0.303, heightRatio: 0.275 }, 'back'),
] as const satisfies readonly RoomDecorationManifestEntry[]);

export const roomDecorationById = new Map(
  roomDecorationManifest.map((item) => [item.itemId, item]),
);
