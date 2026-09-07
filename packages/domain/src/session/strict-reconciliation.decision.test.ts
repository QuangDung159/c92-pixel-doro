import { describe, expect, it } from 'vitest';

import {
  decideStrictReconciliation,
  STRICT_BACKGROUND_GRACE_MS,
} from './strict-reconciliation.decision';

const startedAt = 1_000;
const endsAt = 61_000;

describe('decideStrictReconciliation', () => {
  it.each([
    { now: 60_999, backgroundedAt: null, outcome: 'running_no_evidence' },
    { now: 61_000, backgroundedAt: null, outcome: 'completion_due' },
    { now: 20_999, backgroundedAt: 11_000, outcome: 'running_safe_clear' },
    { now: 21_000, backgroundedAt: 11_000, outcome: 'failed_due' },
    { now: 61_000, backgroundedAt: 51_000, outcome: 'failed_due' },
    { now: 61_000, backgroundedAt: 52_000, outcome: 'completion_due' },
  ])('returns $outcome for evidence=$backgroundedAt at now=$now', (input) => {
    expect(decideStrictReconciliation({ startedAt, endsAt, ...input }).outcome)
      .toBe(input.outcome);
  });

  it('exposes the locked ten-second grace', () => {
    expect(STRICT_BACKGROUND_GRACE_MS).toBe(10_000);
  });

  it.each([
    { startedAt: -1, endsAt, backgroundedAt: null, now: 1_000, reason: 'invalid_timestamp' },
    { startedAt, endsAt: startedAt, backgroundedAt: null, now: startedAt, reason: 'invalid_session_range' },
    { startedAt, endsAt, backgroundedAt: 999, now: 1_000, reason: 'background_before_start' },
    { startedAt, endsAt, backgroundedAt: 2_000, now: 1_999, reason: 'now_before_background' },
    {
      startedAt,
      endsAt: Number.MAX_SAFE_INTEGER,
      backgroundedAt: Number.MAX_SAFE_INTEGER - 1,
      now: Number.MAX_SAFE_INTEGER,
      reason: 'grace_overflow',
    },
  ])('rejects invalid facts as $reason', ({ reason, ...input }) => {
    expect(decideStrictReconciliation(input)).toEqual({ outcome: 'invalid', reason });
  });
});
