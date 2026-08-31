export interface LevelProgression {
  readonly level: number;
  readonly thresholdXp: number;
  readonly nextThresholdXp: number;
  readonly xpIntoLevel: number;
  readonly xpToNextLevel: number;
}

export const levelThresholdXp = (level: number): number => {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError('level must be a positive safe integer');
  }

  const leftFactor = level - 1;
  const rightFactor = level + 2;
  const halvedLeftFactor = leftFactor % 2 === 0 ? leftFactor / 2 : leftFactor;
  const halvedRightFactor = leftFactor % 2 === 0 ? rightFactor : rightFactor / 2;
  const threshold = 25 * halvedLeftFactor * halvedRightFactor;
  if (!Number.isSafeInteger(threshold)) {
    throw new RangeError('level threshold exceeds safe integer range');
  }
  return threshold;
};

export const deriveLevelProgression = (totalXp: number): LevelProgression => {
  if (!Number.isSafeInteger(totalXp) || totalXp < 0) {
    throw new RangeError('totalXp must be a non-negative safe integer');
  }

  let level = Math.max(
    1,
    Math.floor((-1 + Math.sqrt(9 + (8 * totalXp) / 25)) / 2),
  );
  while (levelThresholdXp(level + 1) <= totalXp) level += 1;
  while (levelThresholdXp(level) > totalXp) level -= 1;

  const thresholdXp = levelThresholdXp(level);
  const nextThresholdXp = levelThresholdXp(level + 1);
  return Object.freeze({
    level,
    thresholdXp,
    nextThresholdXp,
    xpIntoLevel: totalXp - thresholdXp,
    xpToNextLevel: nextThresholdXp - totalXp,
  });
};
