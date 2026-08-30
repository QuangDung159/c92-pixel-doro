import { describe, expect, it } from 'vitest';

import { deriveLevelProgression, levelThresholdXp } from './level-progression';

describe('level progression', () => {
  it.each([
    [1, 0],
    [2, 50],
    [3, 125],
    [4, 225],
    [5, 350],
    [10, 1_350],
  ])('maps level %s to its approved threshold %s', (level, threshold) => {
    expect(levelThresholdXp(level)).toBe(threshold);
  });

  it('derives visible progress from cumulative XP without persisting level', () => {
    expect(deriveLevelProgression(30)).toEqual({
      level: 1,
      thresholdXp: 0,
      nextThresholdXp: 50,
      xpIntoLevel: 30,
      xpToNextLevel: 20,
    });
    expect(deriveLevelProgression(160)).toEqual({
      level: 3,
      thresholdXp: 125,
      nextThresholdXp: 225,
      xpIntoLevel: 35,
      xpToNextLevel: 65,
    });
  });

  it.each([-1, 1.5, Number.NaN])('rejects invalid total XP %s', (totalXp) => {
    expect(() => deriveLevelProgression(totalXp)).toThrow(RangeError);
  });
});
