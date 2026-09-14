import { describe, expect, it } from 'vitest';

import type { ApprovedAnalyticsEventName } from '../persistence';
import { validateAnalyticsEventPayload } from './analytics-event.contract';

describe('analytics event contract', () => {
  const valid: Readonly<Record<ApprovedAnalyticsEventName, Record<string, unknown>>> = {
    onboarding_started: {},
    onboarding_completed: {},
    focus_setup_viewed: {},
    focus_session_started: { mode: 'relax', workTag: 'coding', durationMinutes: 25 },
    focus_session_completed: {
      mode: 'relax', workTag: 'study', durationMinutes: 50, terminalStatus: 'completed',
    },
    focus_session_failed: {
      mode: 'strict', workTag: 'writing', durationMinutes: 15, terminalStatus: 'failed',
    },
    focus_session_cancelled: {
      mode: 'relax', workTag: 'reading', durationMinutes: 120, terminalStatus: 'cancelled',
    },
    break_started: { breakType: 'short_break', durationMinutes: 5 },
    break_completed: {
      breakType: 'long_break', durationMinutes: 15, terminalStatus: 'completed',
    },
    reward_granted: { durationMinutes: 25, xpEarned: 25, coinsEarned: 5 },
    shop_viewed: {},
    item_unlocked: { itemId: 'desk-mug', pricePaidCoins: 5 },
    item_equipped: { itemId: 'tiny-plant' },
    history_viewed: {},
    feedback_started: {},
    feedback_submitted: {},
    store_review_requested: {},
  };

  it('accepts all 17 exact event payloads', () => {
    for (const [name, payload] of Object.entries(valid)) {
      expect(validateAnalyticsEventPayload(name as ApprovedAnalyticsEventName, payload)).toBe(true);
    }
  });

  it('rejects extra keys, raw content, mismatched status and invalid item identifiers', () => {
    expect(validateAnalyticsEventPayload('history_viewed', { comment: 'private' })).toBe(false);
    expect(validateAnalyticsEventPayload('feedback_submitted', { score: 5 })).toBe(false);
    expect(validateAnalyticsEventPayload('store_review_requested', { attemptCount: 1 })).toBe(false);
    expect(validateAnalyticsEventPayload('focus_session_completed', {
      ...valid.focus_session_completed,
      terminalStatus: 'failed',
    })).toBe(false);
    expect(validateAnalyticsEventPayload('item_equipped', { itemId: 'unknown' })).toBe(false);
    expect(validateAnalyticsEventPayload('focus_session_started', {
      ...valid.focus_session_started,
      screen: 'setup',
    })).toBe(false);
  });
});

