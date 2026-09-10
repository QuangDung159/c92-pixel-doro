import { describe, expect, it } from 'vitest';

import { decideBreakCancellation } from './break-cancellation.decision';

describe('decideBreakCancellation', () => {
  it.each([
    [299_999, 'cancel_allowed'], [300_000, 'completion_due'], [300_001, 'completion_due'],
  ] as const)('maps capturedAt %s to %s', (capturedAt, kind) => {
    expect(decideBreakCancellation({ startedAt: 0, endsAt: 300_000, capturedAt }))
      .toEqual({ kind });
  });

  it.each([
    { startedAt: -1, endsAt: 300_000, capturedAt: 1 },
    { startedAt: 10, endsAt: 10, capturedAt: 10 },
    { startedAt: 10, endsAt: 20, capturedAt: 9 },
    { startedAt: 10, endsAt: 20, capturedAt: Number.NaN },
  ])('rejects invalid facts', (input) => {
    expect(decideBreakCancellation(input)).toEqual({ kind: 'invalid' });
  });
});
