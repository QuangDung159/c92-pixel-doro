import { describe, expect, it } from 'vitest';

import { createHomeProfileProjection } from './create-home-profile.projection';

describe('createHomeProfileProjection', () => {
  it('projects committed totals into Home progression values', () => {
    expect(createHomeProfileProjection({ totalXp: 30, coinBalance: 6 })).toEqual({
      level: 1,
      totalXp: 30,
      coinBalance: 6,
      levelProgressPercent: 60,
      xpToNextLevel: 20,
    });
  });

  it('rejects an invalid committed balance', () => {
    expect(() =>
      createHomeProfileProjection({ totalXp: 0, coinBalance: -1 }),
    ).toThrow(RangeError);
  });
});
