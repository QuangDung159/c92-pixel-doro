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
  readonly xRatio: number;
  readonly yRatio: number;
  readonly sizeRatio: number;
  readonly layer: 'back' | 'front';
}

export interface RoomDecorationFrame {
  readonly left: number;
  readonly top: number;
  readonly size: number;
}

export const resolveRoomDecorationFrame = (
  item: RoomDecorationManifestEntry,
  room: { readonly width: number; readonly height: number },
): RoomDecorationFrame => Object.freeze({
  left: room.width * item.xRatio,
  top: room.height * item.yRatio,
  size: room.width * item.sizeRatio,
});

const entry = (
  itemId: RoomDecorationItemId,
  atlasColumn: 0 | 1 | 2 | 3,
  atlasRow: 0 | 1 | 2,
  xRatio: number,
  yRatio: number,
  sizeRatio: number,
  layer: 'back' | 'front',
): RoomDecorationManifestEntry => Object.freeze({
  itemId, source: atlas, atlasColumn, atlasRow, xRatio, yRatio, sizeRatio, layer,
});

export const roomDecorationAtlas = Object.freeze({
  width: 1448,
  height: 1086,
  columns: 4,
  rows: 3,
  sha256: 'f2c90f8818602e74aa70313754a87b2223f5924c9635f43bea189d4119788650',
});

export const roomDecorationManifest = Object.freeze([
  entry('desk-mug', 0, 0, 0.035, 0.33, 0.0931, 'front'),
  entry('tiny-plant', 1, 0, 0.125, 0.31, 0.10, 'front'),
  entry('book-stack', 2, 0, 0.30, 0.57, 0.1172, 'front'),
  entry('desk-lamp', 3, 0, 0.02, 0.39, 0.1138, 'back'),
  entry('wall-calendar', 0, 1, 0.38, 0.04, 0.1103, 'back'),
  entry('floor-cushion', 1, 1, 0.72, 0.61, 0.1138, 'front'),
  entry('small-rug', 2, 1, 0.35, 0.62, 0.1655, 'back'),
  entry('wall-poster', 3, 1, 0.73, 0.03, 0.1172, 'back'),
  entry('bookshelf', 0, 2, 0.02, 0.24, 0.1690, 'back'),
  entry('standing-lamp', 1, 2, 0.76, 0.24, 0.1586, 'back'),
  entry('armchair', 2, 2, 0.66, 0.42, 0.1655, 'back'),
  entry('window-view', 3, 2, 0.03, 0.02, 0.1517, 'back'),
] as const satisfies readonly RoomDecorationManifestEntry[]);

export const roomDecorationById = new Map(
  roomDecorationManifest.map((item) => [item.itemId, item]),
);
