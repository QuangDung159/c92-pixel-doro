import { StyleSheet, View } from 'react-native';

import { ItemTile, type ItemTileAction, type ItemTileModel } from './item-tile';

export const ItemGrid = ({
  items,
  actionForItem,
}: {
  readonly items: readonly ItemTileModel[];
  readonly actionForItem?: (item: ItemTileModel) => ItemTileAction | undefined;
}) => (
  <View accessibilityRole="list" style={styles.grid}>
    {items.map((item) => {
      const action = actionForItem?.(item);
      return (
        <View key={item.id} style={styles.cell}>
          {action === undefined
            ? <ItemTile item={item} />
            : <ItemTile action={action} item={item} />}
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { flexBasis: 220, flexGrow: 1, minWidth: 0 },
});
