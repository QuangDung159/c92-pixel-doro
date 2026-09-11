import { describe, expect, it, vi } from 'vitest';

import { RoomDecorationStatus } from './room-decoration-status';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('RoomDecorationStatus', () => {
  it('keeps the normal item summary semantic-only for the simple Pet Room UI', () => {
    const tree = RoomDecorationStatus({
      onRetry: vi.fn(),
      projection: {
        status: 'ready',
        refresh: 'idle',
        room: { items: [
          { itemId: 'desk-mug', displayName: 'Cốc trên bàn', equippedAt: 1 },
          { itemId: 'tiny-plant', displayName: 'Chậu cây nhỏ', equippedAt: 2 },
        ] },
      },
    });
    expect(JSON.stringify(tree)).toContain('Phòng có 2 vật phẩm');
    expect(JSON.stringify(tree)).not.toContain('"type":"Text"');
  });

  it('keeps loading visually quiet', () => {
    expect(RoomDecorationStatus({ onRetry: vi.fn(), projection: { status: 'loading' } })).toBeNull();
  });
});
