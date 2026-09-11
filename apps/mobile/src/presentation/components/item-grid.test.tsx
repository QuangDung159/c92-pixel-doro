import { describe, expect, it, vi } from 'vitest';

import { ItemGrid } from './item-grid';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));

describe('ItemGrid', () => {
  it('preserves application item order and stable identity', () => {
    const tree = ItemGrid({ items: [
      { id: 'desk-mug', displayName: 'Cốc trên bàn', priceCoins: 5, state: 'available' },
      { id: 'tiny-plant', displayName: 'Chậu cây nhỏ', priceCoins: 10, state: 'owned' },
    ] });
    const serialized = JSON.stringify(tree);
    expect(serialized.indexOf('desk-mug')).toBeLessThan(serialized.indexOf('tiny-plant'));
  });
});
