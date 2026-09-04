import { validateStandardFocusConfiguration } from './standard-focus-configuration';

export type StandardFocusRewardDecision =
  | { readonly ok: true; readonly xpEarned: number; readonly coinsEarned: number }
  | { readonly ok: false; readonly code: 'STANDARD_FOCUS_REWARD_INVALID' };

export const calculateStandardFocusReward = (durationMinutes: number): StandardFocusRewardDecision => {
  if (!validateStandardFocusConfiguration({ durationMinutes, mode: 'relax', workTag: 'coding' }).ok) {
    return { ok: false, code: 'STANDARD_FOCUS_REWARD_INVALID' };
  }
  return Object.freeze({ ok: true, xpEarned: durationMinutes, coinsEarned: Math.floor(durationMinutes / 5) });
};
