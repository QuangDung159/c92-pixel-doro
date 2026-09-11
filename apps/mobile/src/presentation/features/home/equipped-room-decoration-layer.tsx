import type { EquippedRoomItem } from '@pixeldoro/application';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import {
  roomBackdropAsset,
  roomDecorationAtlas,
  roomDecorationById,
  resolveRoomDecorationFrame,
  type RoomDecorationItemId,
  type RoomDecorationManifestEntry,
} from '@/presentation/room/item-decoration-manifest';

export interface EquippedRoomDecorationLayerProps {
  readonly items: readonly EquippedRoomItem[];
  readonly layer: 'back' | 'front';
}

interface RoomLayout {
  readonly width: number;
  readonly height: number;
}

const AtlasSprite = ({
  item,
  room,
}: {
  readonly item: RoomDecorationManifestEntry;
  readonly room: RoomLayout;
}) => {
  const frame = resolveRoomDecorationFrame(item, room);
  const size = frame.size;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.spriteWindow, {
        left: frame.left,
        top: frame.top,
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
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    pointerEvents="none"
    style={StyleSheet.absoluteFill}
  >
    <Image
      accessible={false}
      resizeMode="stretch"
      source={roomBackdropAsset.source}
      style={styles.backdrop}
    />
  </View>
);

export const EquippedRoomDecorationLayer = ({
  items,
  layer,
}: EquippedRoomDecorationLayerProps) => {
  const [room, setRoom] = useState<RoomLayout | null>(null);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setRoom((current) => current?.width === width && current.height === height
          ? current
          : { width, height });
      }}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {room === null ? null : items.flatMap((owned) => {
        const item = roomDecorationById.get(owned.itemId as RoomDecorationItemId);
        return item?.layer === layer
          ? [<AtlasSprite item={item} key={item.itemId} room={room} />]
          : [];
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: { height: '100%', width: '100%' },
  spriteWindow: { overflow: 'hidden', position: 'absolute' },
});
