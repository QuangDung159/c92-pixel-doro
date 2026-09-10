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

describe('ShopScreen', () => {
  it('renders production progression and all projected items without actions', () => {
    const tree = ShopScreen({ projection: ready, onRetry: vi.fn() });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('ĐỒ TRANG TRÍ');
    expect(serialized.match(/"displayName":"Item /g)).toHaveLength(12);
    expect(serialized).not.toMatch(/MOCK|Prototype|XEM TRƯỚC|TRANG BỊ ·/);
  });

  it('renders finite loading, initial error and stale refresh error states', () => {
    expect(JSON.stringify(ShopScreen({ projection: { status: 'loading' }, onRetry: vi.fn() })))
      .toContain('Đang mở cửa hàng');
    expect(JSON.stringify(ShopScreen({
      projection: { status: 'error', code: 'SHOP_READ_FAILED' },
      onRetry: vi.fn(),
    }))).toContain('Coin và vật phẩm không bị thay đổi');
    expect(JSON.stringify(ShopScreen({
      projection: { ...ready, refresh: 'error' },
      onRetry: vi.fn(),
    }))).toContain('committed gần nhất');
  });
});
