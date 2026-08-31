import { describe, expect, it } from 'vitest';

import { createPetBaseReviewSessionReader } from './pet-base-review-fixture';

describe('createPetBaseReviewSessionReader', () => {
  it.each([
    ['idle', null],
    ['focus', 'focus'],
    ['short_break', 'short_break'],
    ['long_break', 'long_break'],
  ] as const)('creates explicit %s review truth', async (scenario, sessionType) => {
    const reader = createPetBaseReviewSessionReader(scenario, true);
    const result = await reader?.findActive();

    expect(result).toMatchObject({
      ok: true,
      value: sessionType === null ? null : { sessionType, status: 'running' },
    });
  });

  it('keeps fixtures disabled outside an explicit development review', () => {
    expect(createPetBaseReviewSessionReader('focus', false)).toBeUndefined();
    expect(createPetBaseReviewSessionReader(undefined, true)).toBeUndefined();
    expect(createPetBaseReviewSessionReader('unknown', true)).toBeUndefined();
  });
});
