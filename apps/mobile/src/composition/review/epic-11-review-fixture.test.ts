import { describe, expect, it } from 'vitest';

import {
  createEpic11ReviewFixture,
  epic11ReviewDatabaseName,
  resolveEpic11ReviewScenario,
} from './epic-11-review-fixture';

describe('EPIC-11 review fixture', () => {
  it('is explicit, review-build-only, and isolated by database name', () => {
    expect(resolveEpic11ReviewScenario('epic_11_quick', false)).toBeUndefined();
    expect(resolveEpic11ReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveEpic11ReviewScenario('epic_11_quick', true)).toBe('epic_11_quick');
    expect(epic11ReviewDatabaseName('epic_11_feedback_failure_once'))
      .toBe('pixeldoro-us-11-epic-11-feedback-failure-once.db');
  });

  it('makes each failure-once scenario deterministic', async () => {
    const analytics = createEpic11ReviewFixture('epic_11_analytics_failure_once')!;
    await expect(analytics.analytics.deliver({
      anonymousId: 'install-1',
      events: [],
    })).resolves.toBe('retryable');
    await expect(analytics.analytics.deliver({
      anonymousId: 'install-1',
      events: [],
    })).resolves.toBe('accepted');

    const feedback = createEpic11ReviewFixture('epic_11_feedback_failure_once')!;
    await expect(feedback.feedback.submit({
      submissionId: 'feedback-1',
      score: 5,
      comment: '',
      appVersion: '0.1.0',
      platform: 'ios',
    })).resolves.toBe('retryable');
    await expect(feedback.feedback.submit({
      submissionId: 'feedback-1',
      score: 5,
      comment: '',
      appVersion: '0.1.0',
      platform: 'ios',
    })).resolves.toBe('accepted');
  });

  it('overrides only eligibility thresholds and preserves persisted attempt caps', async () => {
    const nowMs = 1_700_000_000_000;
    const fixture = createEpic11ReviewFixture('epic_11_review_eligible', {
      getFacts: () => Promise.resolve({
        ok: true,
        value: {
          installedAt: nowMs,
          completedStandardFocusCount: 0,
          distinctStandardFocusActiveDayCount: 0,
          latestAttempt: {
            id: 'persisted-attempt',
            appVersion: '0.1.0',
            attemptedAt: nowMs,
          },
          rolling365DayAttemptCount: 1,
          currentVersionAttempted: true,
        },
      }),
    })!;

    await expect(fixture.reviewFacts!.getFacts({
      profileId: 1,
      appVersion: '0.1.0',
      nowMs,
    })).resolves.toMatchObject({
      ok: true,
      value: {
        completedStandardFocusCount: 5,
        distinctStandardFocusActiveDayCount: 3,
        latestAttempt: { id: 'persisted-attempt' },
        rolling365DayAttemptCount: 1,
        currentVersionAttempted: true,
      },
    });
  });
});
