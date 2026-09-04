import { describe, expect, it } from 'vitest';
import { calculateStandardFocusReward } from './standard-focus-reward';

describe('Standard configured reward', () => {
  it.each(Array.from({ length: 22 }, (_, index) => 15 + index * 5))('rewards %i configured minutes', (minutes) => {
    expect(calculateStandardFocusReward(minutes)).toEqual({ ok: true, xpEarned: minutes, coinsEarned: minutes / 5 });
  });
  it.each([NaN, Infinity, -Infinity, -1, 0, 5, 14, 16, 15.5, 125, Number.MAX_SAFE_INTEGER])('rejects %s without clamping', (minutes) => {
    expect(calculateStandardFocusReward(minutes).ok).toBe(false);
  });
});
