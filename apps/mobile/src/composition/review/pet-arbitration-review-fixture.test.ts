import { describe, expect, it } from 'vitest';

import { createPetArbitrationReviewFixture } from './pet-arbitration-review-fixture';

describe('createPetArbitrationReviewFixture', () => {
  it.each([
    'preempt_break',
    'preempt_focus',
    'stale_after_active',
    'conflicting_terminal',
    'reopen_relaunch',
    'background_discard',
  ])('creates explicit %s review actions with an idle base', async (scenario) => {
    const fixture = createPetArbitrationReviewFixture(scenario, true);

    expect(fixture?.actions.length).toBeGreaterThan(0);
    await expect(fixture?.sessionReader.findActive()).resolves.toMatchObject({
      ok: true,
      value: null,
    });
  });

  it('allows a committed active base to preempt without a database write', async () => {
    const fixture = createPetArbitrationReviewFixture('preempt_break', true);
    fixture?.setBaseScenario('short_break');

    await expect(fixture?.sessionReader.findActive()).resolves.toMatchObject({
      ok: true,
      value: { sessionType: 'short_break', status: 'running' },
    });
  });

  it('keeps fixtures development-only and explicit', () => {
    expect(createPetArbitrationReviewFixture('preempt_break', false)).toBeUndefined();
    expect(createPetArbitrationReviewFixture(undefined, true)).toBeUndefined();
    expect(createPetArbitrationReviewFixture('unknown', true)).toBeUndefined();
  });
});
