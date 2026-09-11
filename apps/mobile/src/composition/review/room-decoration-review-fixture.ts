import type { EquippedRoomProjection } from '@pixeldoro/application';

import { INITIAL_CATALOG_SEED } from '@/infrastructure/database/migrations/schema-manifest';

export type RoomDecorationReviewScenario = 'room_full_equipped';

export const resolveRoomDecorationReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): RoomDecorationReviewScenario | undefined =>
  enabled && value === 'room_full_equipped' ? value : undefined;

export const createRoomDecorationReviewProjection = (
  scenario: RoomDecorationReviewScenario | undefined,
): EquippedRoomProjection | undefined => {
  if (scenario === undefined) return undefined;
  const items = INITIAL_CATALOG_SEED.map((item, index) => Object.freeze({
    itemId: item.id,
    displayName: item.displayName,
    equippedAt: 1_789_000_000_000 + index,
  }));
  Object.freeze(items);
  return Object.freeze({ items });
};
