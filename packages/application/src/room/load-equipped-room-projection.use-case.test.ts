import { describe, expect, it } from 'vitest';

import type { CatalogItemRecord } from '../persistence/catalog.repository';
import type { OwnedItemRecord } from '../persistence/owned-item.repository';
import { LoadEquippedRoomProjectionUseCase, type ApprovedRoomCatalogItem } from './load-equipped-room-projection.use-case';

const approved: readonly ApprovedRoomCatalogItem[] = [
  { id: 'mug', displayName: 'Cốc', category: 'furniture', priceCoins: 5, catalogVersion: 1 },
  { id: 'plant', displayName: 'Cây', category: 'furniture', priceCoins: 10, catalogVersion: 1 },
];
const catalog: readonly CatalogItemRecord[] = approved.map((item) => ({ ...item, createdAt: 1, updatedAt: 1 }));
const owned: readonly OwnedItemRecord[] = [
  { profileId: 1, itemId: 'plant', purchaseTransactionId: 'p-2', unlockedAt: 2, isEquipped: true, equippedAt: 3, updatedAt: 3 },
  { profileId: 1, itemId: 'mug', purchaseTransactionId: 'p-1', unlockedAt: 1, isEquipped: false, equippedAt: null, updatedAt: 1 },
];

describe('LoadEquippedRoomProjectionUseCase', () => {
  it('returns only equipped items in approved catalog order as immutable data', async () => {
    const result = await new LoadEquippedRoomProjectionUseCase({
      approvedCatalog: approved,
      catalog: { list: async () => ({ ok: true, value: catalog }) },
      ownedItems: { listByProfile: async () => ({ ok: true, value: owned }) },
    }).execute();

    expect(result).toEqual({ ok: true, value: { items: [{ itemId: 'plant', displayName: 'Cây', equippedAt: 3 }] } });
    expect(result.ok && Object.isFrozen(result.value.items)).toBe(true);
  });

  it('fails closed when ownership references an unknown item', async () => {
    const result = await new LoadEquippedRoomProjectionUseCase({
      approvedCatalog: approved,
      catalog: { list: async () => ({ ok: true, value: catalog }) },
      ownedItems: { listByProfile: async () => ({ ok: true, value: [{ ...owned[0]!, itemId: 'unknown' }] }) },
    }).execute();
    expect(result).toEqual({ ok: false, error: { kind: 'load_equipped_room_projection_error', code: 'ROOM_OWNERSHIP_INVALID' } });
  });
});
