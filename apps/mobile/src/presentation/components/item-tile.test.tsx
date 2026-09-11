import { describe, expect, it, vi } from 'vitest';

import { ItemTile } from './item-tile';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('ItemTile', () => {
  it.each([
    ['available', 'Có thể mua'],
    ['owned', 'Đã sở hữu'],
    ['equipped', 'Đang trang bị'],
  ] as const)('renders a non-interactive %s state', (state, label) => {
    const tree = ItemTile({
      item: { id: 'desk-mug', displayName: 'Cốc trên bàn', priceCoins: 5, state },
    });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(label);
    expect(serialized).toContain(`Cốc trên bàn, 5 Coin, ${label}`);
    expect(serialized).not.toMatch(/onPress|button/);
  });

  it('renders an optional explicit purchase action', () => {
    const tree = ItemTile({
      item: { id: 'desk-mug', displayName: 'Cốc trên bàn', priceCoins: 5, state: 'available' },
      action: { label: 'Mua', onPress: vi.fn() },
    });
    expect(JSON.stringify(tree)).toContain('Mua');
  });
});
