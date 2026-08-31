import { describe, expect, it } from 'vitest';

import { createPetTerminalReviewFixture } from './pet-terminal-review-fixture';

describe('createPetTerminalReviewFixture', () => {
  it.each([
    ['completed', 'completed', 'focus'],
    ['strict_failed', 'failed', 'focus'],
    ['cancelled', 'cancelled', 'focus'],
    ['break_completed', 'completed', 'short_break'],
  ] as const)('creates explicit %s committed-transition review input', (
    scenario,
    terminalStatus,
    sessionType,
  ) => {
    expect(createPetTerminalReviewFixture(scenario, true)).toMatchObject({
      transition: { terminalStatus, sessionType },
    });
  });

  it('keeps terminal fixtures development-only and explicit', () => {
    expect(createPetTerminalReviewFixture('completed', false)).toBeUndefined();
    expect(createPetTerminalReviewFixture(undefined, true)).toBeUndefined();
    expect(createPetTerminalReviewFixture('unknown', true)).toBeUndefined();
  });
});
