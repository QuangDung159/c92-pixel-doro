import { StyleSheet, View } from 'react-native';

import { ItemTile, type ItemTileModel } from './item-tile';

export const ItemGrid = ({ items }: { readonly items: readonly ItemTileModel[] }) => (
  <View accessibilityRole="list" style={styles.grid}>
    {items.map((item) => (
      <View key={item.id} style={styles.cell}>
        <ItemTile item={item} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { flexBasis: 220, flexGrow: 1, minWidth: 0 },
});
