import type { ShopItemState } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';
import { Panel } from './panel';

export interface ItemTileModel {
  readonly id: string;
  readonly displayName: string;
  readonly priceCoins: number;
  readonly state: ShopItemState;
}

const stateLabel = (state: ShopItemState): string => {
  switch (state) {
    case 'available':
      return 'Có thể mua';
    case 'owned':
      return 'Đã sở hữu';
    case 'equipped':
      return 'Đang trang bị';
  }
};

export const ItemTile = ({ item }: { readonly item: ItemTileModel }) => {
  const label = stateLabel(item.state);
  return (
    <Panel style={styles.panel} tone={item.state === 'equipped' ? 'gold' : 'default'}>
      <View
        accessible
        accessibilityLabel={`${item.displayName}, ${item.priceCoins} Coin, ${label}`}
      >
        <Text accessibilityElementsHidden style={styles.marker}>◆</Text>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.price}>{item.priceCoins} Coin</Text>
        <Text style={styles.state}>{label}</Text>
      </View>
    </Panel>
  );
};

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 176 },
  marker: { color: palette.accentDark, fontSize: 36, fontWeight: '900', textAlign: 'center' },
  name: { color: palette.textPrimary, fontSize: 17, fontWeight: '900', lineHeight: 22, textAlign: 'center' },
  price: { color: palette.textSecondary, fontSize: 14, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  state: { color: palette.accentBlue, fontSize: 12, fontWeight: '900', marginTop: 8, textAlign: 'center' },
});
