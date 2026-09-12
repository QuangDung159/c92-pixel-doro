import { Image, StyleSheet, View } from 'react-native';

import {
  roomDecorationAtlas,
  roomDecorationById,
  type RoomDecorationItemId,
} from './item-decoration-manifest';

const MAX_SPRITE_WIDTH = 88;
const MAX_SPRITE_HEIGHT = 76;
const ATLAS_CELL_SIZE = 362;

export const RoomDecorationThumbnail = ({ itemId }: { readonly itemId: string }) => {
  const item = roomDecorationById.get(itemId as RoomDecorationItemId);
  if (item === undefined) return null;

  const scale = Math.min(
    MAX_SPRITE_WIDTH / item.sourceBounds.width,
    MAX_SPRITE_HEIGHT / item.sourceBounds.height,
  );
  const sourceLeft = (item.atlasColumn * ATLAS_CELL_SIZE + item.sourceBounds.x) * scale;
  const sourceTop = (item.atlasRow * ATLAS_CELL_SIZE + item.sourceBounds.y) * scale;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.thumbnail}
      testID={`item-sprite-${item.itemId}`}
    >
      <View style={[styles.spriteWindow, {
        width: item.sourceBounds.width * scale,
        height: item.sourceBounds.height * scale,
      }]}
      >
        <Image
          accessible={false}
          resizeMode="stretch"
          source={item.source}
          style={{
            position: 'absolute',
            width: roomDecorationAtlas.width * scale,
            height: roomDecorationAtlas.height * scale,
            left: -sourceLeft,
            top: -sourceTop,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    alignItems: 'center',
    height: MAX_SPRITE_HEIGHT,
    justifyContent: 'center',
    marginBottom: 6,
  },
  spriteWindow: { overflow: 'hidden' },
});
