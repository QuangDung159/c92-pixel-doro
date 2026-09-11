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
  readonly left: `${number}%`;
  readonly top: `${number}%`;
  readonly cellSize: number;
  readonly layer: 'back' | 'front';
}

const entry = (
  itemId: RoomDecorationItemId,
  atlasColumn: 0 | 1 | 2 | 3,
  atlasRow: 0 | 1 | 2,
  left: `${number}%`,
  top: `${number}%`,
  cellSize: number,
  layer: 'back' | 'front',
): RoomDecorationManifestEntry => Object.freeze({
  itemId, source: atlas, atlasColumn, atlasRow, left, top, cellSize, layer,
});

export const roomDecorationAtlas = Object.freeze({
  width: 1448,
  height: 1086,
  columns: 4,
  rows: 3,
  sha256: 'f2c90f8818602e74aa70313754a87b2223f5924c9635f43bea189d4119788650',
});

export const roomDecorationManifest = Object.freeze([
  entry('desk-mug', 0, 0, '25%', '46%', 54, 'front'),
  entry('tiny-plant', 1, 0, '10%', '35%', 58, 'front'),
  entry('book-stack', 2, 0, '30%', '57%', 68, 'front'),
  entry('desk-lamp', 3, 0, '2%', '39%', 66, 'back'),
  entry('wall-calendar', 0, 1, '38%', '4%', 64, 'back'),
  entry('floor-cushion', 1, 1, '72%', '61%', 66, 'front'),
  entry('small-rug', 2, 1, '35%', '62%', 96, 'back'),
  entry('wall-poster', 3, 1, '73%', '3%', 68, 'back'),
  entry('bookshelf', 0, 2, '2%', '24%', 98, 'back'),
  entry('standing-lamp', 1, 2, '76%', '24%', 92, 'back'),
  entry('armchair', 2, 2, '66%', '42%', 96, 'back'),
  entry('window-view', 3, 2, '3%', '2%', 88, 'back'),
] as const satisfies readonly RoomDecorationManifestEntry[]);

export const roomDecorationById = new Map(
  roomDecorationManifest.map((item) => [item.itemId, item]),
);
