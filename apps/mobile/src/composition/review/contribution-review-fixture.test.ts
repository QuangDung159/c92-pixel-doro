import { describe, expect, it } from 'vitest';

import {
  contributionReviewDatabaseName,
  createContributionReviewFixture,
  resolveContributionReviewScenario,
} from './contribution-review-fixture';

describe('contribution review fixture', () => {
  it('resolves only the finite dev-only allowlist and isolated database names', () => {
    expect(resolveContributionReviewScenario('contribution_mixed_week', true))
      .toBe('contribution_mixed_week');
    expect(resolveContributionReviewScenario('contribution_mixed_week', false)).toBeUndefined();
    expect(resolveContributionReviewScenario('pixeldoro.db', true)).toBeUndefined();
    expect(contributionReviewDatabaseName('contribution_zero_week'))
      .toBe('pixeldoro-us-09-03-contribution_zero_week.db');
  });

  it('returns deterministic mixed facts and an updated timezone range anchor', async () => {
    const mixed = createContributionReviewFixture('contribution_mixed_week')!;
    const result = await mixed.contribution.listRange({
      profileId: 1, startLocalDate: '2026-09-06', endLocalDate: '2026-09-12',
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error('expected mixed contribution');
    expect(result.value[0]).toMatchObject({ totalCompletedMinutes: 15 });
    const changed = createContributionReviewFixture('contribution_timezone_changed')!;
    expect(changed.calendar.snapshot(changed.clock.nowMs())).toMatchObject({
      ok: true, value: { localDate: '2026-09-13' },
    });
  });

  it('fails exactly one contribution read then recovers', async () => {
    const fixture = createContributionReviewFixture('contribution_read_failure_once')!;
    const input = { profileId: 1, startLocalDate: '2026-09-06', endLocalDate: '2026-09-12' };
    await expect(fixture.contribution.listRange(input)).resolves.toMatchObject({ ok: false });
    await expect(fixture.contribution.listRange(input)).resolves.toMatchObject({ ok: true });
  });
});
