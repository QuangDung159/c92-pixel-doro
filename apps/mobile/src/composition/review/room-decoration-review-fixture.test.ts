import { describe, expect, it } from 'vitest';

import {
  createRoomDecorationReviewProjection,
  resolveRoomDecorationReviewScenario,
} from './room-decoration-review-fixture';

describe('room decoration review fixture', () => {
  it('is dev-gated and exposes the exact twelve-item full-room projection', () => {
    expect(resolveRoomDecorationReviewScenario('room_full_equipped', false)).toBeUndefined();
    const scenario = resolveRoomDecorationReviewScenario('room_full_equipped', true);
    const projection = createRoomDecorationReviewProjection(scenario);
    expect(projection?.items).toHaveLength(12);
    expect(projection?.items.map(({ itemId }) => itemId)).toEqual([
      'desk-mug', 'tiny-plant', 'book-stack', 'desk-lamp', 'wall-calendar',
      'floor-cushion', 'small-rug', 'wall-poster', 'bookshelf', 'standing-lamp',
      'armchair', 'window-view',
    ]);
    expect(Object.isFrozen(projection?.items)).toBe(true);
  });
});
