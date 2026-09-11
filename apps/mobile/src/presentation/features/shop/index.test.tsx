import { describe, expect, it, vi } from 'vitest';

import { ShopScreen } from './index';

vi.mock('react-native', () => ({
  ScrollView: 'ScrollView',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

const ready = {
  status: 'ready' as const,
  refresh: 'idle' as const,
  purchase: { status: 'idle' as const },
  shop: {
    profile: {
      level: 1,
      totalXp: 0,
      coinBalance: 0,
      levelProgressPercent: 0,
      xpToNextLevel: 50,
    },
    items: Array.from({ length: 12 }, (_, index) => ({
      id: `item-${index}`,
      displayName: `Item ${index}`,
      category: 'furniture' as const,
      priceCoins: index + 1,
      state: 'available' as const,
    })),
  },
};

const actions = {
  onRetry: vi.fn(),
  onRequestPurchase: vi.fn(),
  onConfirmPurchase: vi.fn(),
  onDismissPurchase: vi.fn(),
  onRetryPurchaseRefresh: vi.fn(),
};

describe('ShopScreen', () => {
  it('renders production progression, items, and exact affordability actions', () => {
    const tree = ShopScreen({ projection: ready, ...actions });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('ĐỒ TRANG TRÍ');
    expect(serialized.match(/"displayName":"Item /g)).toHaveLength(12);
    expect(serialized).not.toMatch(/MOCK|Prototype|XEM TRƯỚC|TRANG BỊ ·/);
  });

  it('renders finite loading, initial error and stale refresh error states', () => {
    expect(JSON.stringify(ShopScreen({ projection: { status: 'loading' }, ...actions })))
      .toContain('Đang mở cửa hàng');
    expect(JSON.stringify(ShopScreen({
      projection: { status: 'error', code: 'SHOP_READ_FAILED' },
      ...actions,
    }))).toContain('Coin và vật phẩm không bị thay đổi');
    expect(JSON.stringify(ShopScreen({
      projection: { ...ready, refresh: 'error' },
      ...actions,
    }))).toContain('committed gần nhất');
  });

  it('renders purchase confirmation and committed refresh-only recovery copy', () => {
    expect(JSON.stringify(ShopScreen({
      projection: { ...ready, shop: {
        ...ready.shop,
        profile: { ...ready.shop.profile, coinBalance: 5 },
      }, purchase: { status: 'confirming', itemId: 'item-4' } },
      ...actions,
    }))).toContain('Mua với 5 Coin');
    expect(JSON.stringify(ShopScreen({
      projection: {
        ...ready,
        purchase: { status: 'committed_refresh_pending', itemId: 'item-0' },
      },
      ...actions,
    }))).toContain('Đã ghi nhận giao dịch');
  });
});
