import { deriveLevelProgression } from '@pixeldoro/domain';

export interface HomeProfileProjection {
  readonly level: number;
  readonly totalXp: number;
  readonly coinBalance: number;
  readonly levelProgressPercent: number;
  readonly xpToNextLevel: number;
}

export const createHomeProfileProjection = (input: {
  readonly totalXp: number;
  readonly coinBalance: number;
}): HomeProfileProjection => {
  if (!Number.isSafeInteger(input.coinBalance) || input.coinBalance < 0) {
    throw new RangeError('coinBalance must be a non-negative safe integer');
  }

  const progression = deriveLevelProgression(input.totalXp);
  const levelSpan = progression.nextThresholdXp - progression.thresholdXp;
  return Object.freeze({
    level: progression.level,
    totalXp: input.totalXp,
    coinBalance: input.coinBalance,
    levelProgressPercent: Math.round((progression.xpIntoLevel / levelSpan) * 100),
    xpToNextLevel: progression.xpToNextLevel,
  });
};
