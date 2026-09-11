import type { EquippedRoomItem } from '@pixeldoro/application';
import { Image, StyleSheet, View } from 'react-native';

import {
  roomBackdropAsset,
  roomDecorationAtlas,
  roomDecorationById,
  type RoomDecorationItemId,
  type RoomDecorationManifestEntry,
} from '@/presentation/room/item-decoration-manifest';

export interface EquippedRoomDecorationLayerProps {
  readonly items: readonly EquippedRoomItem[];
  readonly layer: 'back' | 'front';
}

const AtlasSprite = ({ item }: { readonly item: RoomDecorationManifestEntry }) => {
  const size = item.cellSize;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.spriteWindow, {
        left: item.left,
        top: item.top,
        width: size,
        height: size,
      }]}
    >
      <Image
        accessible={false}
        resizeMode="stretch"
        source={item.source}
        style={{
          position: 'absolute',
          width: size * roomDecorationAtlas.columns,
          height: size * roomDecorationAtlas.rows,
          left: -item.atlasColumn * size,
          top: -item.atlasRow * size,
        }}
      />
    </View>
  );
};

export const RoomBackdropLayer = () => (
  <Image
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    resizeMode="contain"
    source={roomBackdropAsset.source}
    style={StyleSheet.absoluteFill}
  />
);

export const EquippedRoomDecorationLayer = ({
  items,
  layer,
}: EquippedRoomDecorationLayerProps) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    pointerEvents="none"
    style={StyleSheet.absoluteFill}
  >
    {items.flatMap((owned) => {
      const item = roomDecorationById.get(owned.itemId as RoomDecorationItemId);
      return item?.layer === layer ? [<AtlasSprite item={item} key={item.itemId} />] : [];
    })}
  </View>
);

const styles = StyleSheet.create({
  spriteWindow: { overflow: 'hidden', position: 'absolute' },
});
