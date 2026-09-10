import { describe, expect, it, vi } from 'vitest';

import {
  breakCadenceReviewDatabaseName,
  createBreakCadenceReviewFixture,
  resolveBreakCadenceReviewScenario,
} from './break-cadence-review-fixture';

describe('Break cadence review fixture', () => {
  it('accepts only finite scenarios behind the development gate', () => {
    expect(resolveBreakCadenceReviewScenario('break_cadence_count_4', false))
      .toBeUndefined();
    expect(resolveBreakCadenceReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveBreakCadenceReviewScenario('break_cadence_count_4', true))
      .toBe('break_cadence_count_4');
    expect(breakCadenceReviewDatabaseName('break_cadence_count_4'))
      .toBe('pixeldoro-us-07-01-break_cadence_count_4.db');
  });

  it('fails one query then delegates Retry to durable facts', async () => {
    const getFacts = vi.fn(async () => ({
      ok: true as const,
      value: {
        profileId: 1,
        completedStandardFocusCountSinceLastCompletedLongBreak: 4,
        latestCompletedLongBreak: null,
      },
    }));
    const fixture = createBreakCadenceReviewFixture(
      'break_cadence_read_failure_once',
      { getFacts },
    );
    if (fixture === undefined) throw new Error('fixture_missing');
    expect(await fixture.longBreakCadence.getFacts(1)).toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_QUERY_FAILED' },
    });
    expect(await fixture.longBreakCadence.getFacts(1)).toMatchObject({
      ok: true,
      value: { completedStandardFocusCountSinceLastCompletedLongBreak: 4 },
    });
    expect(getFacts).toHaveBeenCalledOnce();
    expect(fixture.sourceSessionId).toBe('us0701-focus-4');
  });
});
