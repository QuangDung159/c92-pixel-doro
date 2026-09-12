import type { ShopItemState } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';
import { RoomDecorationThumbnail } from '@/presentation/room/room-decoration-thumbnail';
import { PrimaryButton } from './button';
import { Panel } from './panel';

export interface ItemTileModel {
  readonly id: string;
  readonly displayName: string;
  readonly priceCoins: number;
  readonly state: ShopItemState;
}

export interface ItemTileAction {
  readonly label: string;
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly onPress: () => void;
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

export const ItemTile = ({
  item,
  action,
}: {
  readonly item: ItemTileModel;
  readonly action?: ItemTileAction;
}) => {
  const label = stateLabel(item.state);
  return (
    <Panel style={styles.panel} tone={item.state === 'equipped' ? 'gold' : 'default'}>
      <View
        accessible
        accessibilityLabel={`${item.displayName}, ${item.priceCoins} Coin, ${label}`}
      >
        <RoomDecorationThumbnail itemId={item.id} />
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.price}>{item.priceCoins} Coin</Text>
        <Text style={styles.state}>{label}</Text>
      </View>
      {action === undefined ? null : (
        <PrimaryButton
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          busy={action.busy ?? false}
          disabled={action.disabled ?? false}
          label={action.label}
          onPress={action.onPress}
        />
      )}
    </Panel>
  );
};

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 176 },
  name: { color: palette.textPrimary, fontSize: 17, fontWeight: '900', lineHeight: 22, textAlign: 'center' },
  price: { color: palette.textSecondary, fontSize: 14, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  state: { color: palette.accentBlue, fontSize: 12, fontWeight: '900', marginTop: 8, textAlign: 'center' },
});
