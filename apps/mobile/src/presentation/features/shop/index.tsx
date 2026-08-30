import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ControlButton,
  ErrorState,
  LoadingState,
  PixelPanel,
  PrototypeBadge,
  PrototypeControls,
  PrototypeScreen,
  ScreenHeader,
} from '@/presentation/components/prototype-ui';
import { palette } from '@/presentation/theme/palette';

type ShopReviewState = 'sample' | 'loading' | 'error';

const sampleItems = [
  { glyph: '▣', name: 'Cốc trên bàn', price: 5, owned: true },
  { glyph: '♧', name: 'Chậu cây nhỏ', price: 10, owned: false },
  { glyph: '▤', name: 'Chồng sách', price: 15, owned: false },
] as const;

export const ShopScreen = () => {
  const [reviewState, setReviewState] = useState<ShopReviewState>('sample');

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description="Biến thời gian tập trung thành những thay đổi nhỏ trong căn phòng."
        eyebrow="SHOP · 6 COIN MOCK"
        title="Một góc riêng đang lớn dần."
      />
      {reviewState === 'loading' ? <LoadingState label="Đang mở catalog mock…" /> : null}
      {reviewState === 'error' ? (
        <ErrorState body="Catalog mock chưa hiển thị. Coin giả không bị thay đổi." onRetry={() => setReviewState('sample')} title="Cửa hàng cần thử lại" />
      ) : null}
      {reviewState === 'sample' ? (
        <View style={styles.grid}>
          {sampleItems.map((item) => (
            <PixelPanel key={item.name} style={styles.itemCard} tone={item.owned ? 'strong' : 'default'}>
              <Text accessibilityLabel={`Placeholder ${item.name}`} style={styles.itemGlyph}>{item.glyph}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.owned ? 'Đã sở hữu' : `${item.price} Coin`}</Text>
              <Text style={styles.fakeAction}>{item.owned ? 'TRANG BỊ · MOCK' : 'XEM TRƯỚC · MOCK'}</Text>
            </PixelPanel>
          ))}
        </View>
      ) : null}
      <Text style={styles.boundaryCopy}>Không có purchase, debit Coin hoặc equip thật trong prototype.</Text>
      <PrototypeControls>
        <ControlButton label="Catalog" onPress={() => setReviewState('sample')} />
        <ControlButton label="Loading" onPress={() => setReviewState('loading')} />
        <ControlButton label="Error" onPress={() => setReviewState('error')} />
      </PrototypeControls>
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  grid: { gap: 12 },
  itemCard: { alignItems: 'center' },
  itemGlyph: { color: palette.accentDark, fontSize: 50, fontWeight: '900' },
  itemName: { color: palette.textPrimary, fontSize: 17, fontWeight: '900' },
  itemPrice: { color: palette.textSecondary, fontSize: 13, fontWeight: '800' },
  fakeAction: { color: palette.accentBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  boundaryCopy: { color: palette.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
