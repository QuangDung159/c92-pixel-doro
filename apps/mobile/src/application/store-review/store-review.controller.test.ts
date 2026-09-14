import { describe, expect, it, vi } from 'vitest';

import type { StoreReviewFacts } from '../persistence';
import {
  STORE_REVIEW_COOLDOWN_MS,
  STORE_REVIEW_MIN_INSTALL_AGE_MS,
  StoreReviewController,
  isStoreReviewEligible,
} from './store-review.controller';

const nowMs = 2_000_000_000_000;
const eligibleFacts = (overrides: Partial<StoreReviewFacts> = {}): StoreReviewFacts => ({
  installedAt: nowMs - STORE_REVIEW_MIN_INSTALL_AGE_MS,
  completedStandardFocusCount: 5,
  distinctStandardFocusActiveDayCount: 3,
  latestAttempt: null,
  rolling365DayAttemptCount: 0,
  currentVersionAttempted: false,
  ...overrides,
});

describe('store review policy', () => {
  it('enforces install/session/day/cooldown/year/version boundaries', () => {
    expect(isStoreReviewEligible({ facts: eligibleFacts(), nowMs })).toBe(true);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ installedAt: nowMs - STORE_REVIEW_MIN_INSTALL_AGE_MS + 1 }), nowMs,
    })).toBe(false);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ completedStandardFocusCount: 4 }), nowMs,
    })).toBe(false);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ distinctStandardFocusActiveDayCount: 2 }), nowMs,
    })).toBe(false);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ rolling365DayAttemptCount: 3 }), nowMs,
    })).toBe(false);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ currentVersionAttempted: true }), nowMs,
    })).toBe(false);
    expect(isStoreReviewEligible({
      facts: eligibleFacts({ latestAttempt: {
        id: 'old', appVersion: '0.0.9', attemptedAt: nowMs - STORE_REVIEW_COOLDOWN_MS + 1,
      } }), nowMs,
    })).toBe(false);
  });
});

const setup = (facts: StoreReviewFacts = eligibleFacts()) => {
  let active = true;
  const insert = vi.fn().mockResolvedValue({ ok: true, value: undefined });
  const request = vi.fn().mockResolvedValue(undefined);
  const recordRequested = vi.fn();
  const controller = new StoreReviewController({
    appVersion: '0.1.0',
    attempts: { insert },
    clock: { nowMs: () => nowMs },
    facts: { getFacts: vi.fn().mockResolvedValue({ ok: true, value: facts }) },
    id: { nextId: () => 'attempt-1' },
    isAppActive: () => active,
    isProduction: true,
    nativeReview: { isAvailable: vi.fn().mockResolvedValue(true), request },
    sessions: { findActive: vi.fn().mockResolvedValue({ ok: true, value: null }) },
    recordRequested,
  });
  return { controller, insert, recordRequested, request, background: () => { active = false; } };
};

describe('StoreReviewController', () => {
  it('persists the attempt before exactly one native call and analytics intent', async () => {
    const fixture = setup();
    expect(await fixture.controller.requestAtHome('receipt-1')).toBe('requested');
    expect(fixture.insert).toHaveBeenCalledWith({
      id: 'attempt-1', appVersion: '0.1.0', attemptedAt: nowMs, createdAt: nowMs,
    });
    expect(fixture.insert.mock.invocationCallOrder[0]).toBeLessThan(
      fixture.request.mock.invocationCallOrder[0] ?? 0,
    );
    expect(fixture.recordRequested).toHaveBeenCalledWith('attempt-1', nowMs);
    expect(await fixture.controller.requestAtHome('receipt-1')).toBe('ineligible');
    expect(fixture.request).toHaveBeenCalledTimes(1);
  });

  it('does not call native on ineligible, active-session or persistence failure paths', async () => {
    const ineligible = setup(eligibleFacts({ completedStandardFocusCount: 4 }));
    expect(await ineligible.controller.requestAtHome('one')).toBe('ineligible');
    expect(ineligible.insert).not.toHaveBeenCalled();
    expect(ineligible.request).not.toHaveBeenCalled();

    const failed = setup();
    failed.insert.mockResolvedValue({ ok: false, error: { kind: 'persistence_error' } });
    expect(await failed.controller.requestAtHome('two')).toBe('persistence_unavailable');
    expect(failed.request).not.toHaveBeenCalled();
  });

  it('discards background-stale context and retains a committed failed native attempt', async () => {
    const stale = setup();
    stale.background();
    expect(await stale.controller.requestAtHome('stale')).toBe('ineligible');
    expect(stale.insert).not.toHaveBeenCalled();

    const failed = setup();
    failed.request.mockRejectedValue(new Error('native'));
    expect(await failed.controller.requestAtHome('native')).toBe('native_failed_attempt_counted');
    expect(failed.insert).toHaveBeenCalledTimes(1);
  });
});
