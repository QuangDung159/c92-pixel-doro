import { describe, expect, it, vi } from 'vitest';

import { ItemGrid } from '@/presentation/components';
import { ShopScreen } from './index';
import { ShopEquipNotice } from './shop-equip-notice';

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
  equip: { status: 'idle' as const },
  mode: 'catalog' as const,
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
  onSetViewMode: vi.fn(),
  onSetItemEquipped: vi.fn(),
  onRetryEquipRefresh: vi.fn(),
  onDismissEquipNotice: vi.fn(),
};

const findElement = (
  node: unknown,
  type: unknown,
): { readonly props: Record<string, unknown> } | undefined => {
  if (node === null || typeof node !== 'object') return undefined;
  const element = node as { readonly type?: unknown; readonly props?: Record<string, unknown> };
  if (element.type === type && element.props !== undefined) return { props: element.props };
  const children = element.props?.children;
  const candidates = Array.isArray(children) ? children : [children];
  for (const child of candidates) {
    const match = findElement(child, type);
    if (match !== undefined) return match;
  }
  return undefined;
};

describe('ShopScreen', () => {
  it('renders production progression, items, and exact affordability actions', () => {
    const tree = ShopScreen({ projection: ready, ...actions });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('ĐỒ TRANG TRÍ');
    expect(findElement(tree, ItemGrid)?.props.items).toHaveLength(12);
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

  it('filters Inventory, exposes direct equip actions, and renders its empty state', () => {
    const mixed = {
      ...ready,
      mode: 'inventory' as const,
      shop: {
        ...ready.shop,
        items: [
          { ...ready.shop.items[0]!, state: 'available' as const },
          { ...ready.shop.items[1]!, state: 'owned' as const },
          { ...ready.shop.items[2]!, state: 'equipped' as const },
        ],
      },
    };
    const tree = ShopScreen({ projection: mixed, ...actions });
    const grid = findElement(tree, ItemGrid)?.props;
    expect(grid?.items).toEqual(mixed.shop.items.slice(1));
    const actionForItem = grid?.actionForItem as
      ((item: (typeof mixed.shop.items)[number]) => { accessibilityLabel?: string });
    expect(actionForItem(mixed.shop.items[1]!).accessibilityLabel).toBe('Trang bị Item 1');
    expect(actionForItem(mixed.shop.items[2]!).accessibilityLabel).toBe('Tháo Item 2');

    const empty = JSON.stringify(ShopScreen({
      projection: { ...ready, mode: 'inventory' },
      ...actions,
    }));
    expect(empty).toContain('Chưa có vật phẩm đã sở hữu');
    expect(empty).toContain('Xem cửa hàng');
  });

  it('renders equipment success and committed refresh-only recovery copy', () => {
    const ownedShop = {
      ...ready.shop,
      items: [{ ...ready.shop.items[0]!, state: 'equipped' as const }],
    };
    const successProjection = {
      ...ready,
      shop: ownedShop,
      equip: { status: 'success' as const, itemId: 'item-0', equipped: true },
    };
    expect(JSON.stringify(ShopEquipNotice({
      projection: successProjection,
      onDismiss: actions.onDismissEquipNotice,
      onRetryRefresh: actions.onRetryEquipRefresh,
    }))).toContain('Đã trang bị Item 0');
    expect(JSON.stringify(ShopEquipNotice({
      projection: {
        ...successProjection,
        equip: {
          status: 'committed_refresh_pending', itemId: 'item-0', equipped: true,
        },
      },
      onDismiss: actions.onDismissEquipNotice,
      onRetryRefresh: actions.onRetryEquipRefresh,
    }))).toContain('Đã lưu thay đổi trang bị');
  });
});
