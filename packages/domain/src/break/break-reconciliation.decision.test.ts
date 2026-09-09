import { describe, expect, it } from 'vitest';

import { decideBreakReconciliation } from './break-reconciliation.decision';

const decide = (nowMs: number) => decideBreakReconciliation({
  startedAt: 1_000,
  endsAt: 301_000,
  updatedAt: 1_000,
  nowMs,
});

describe('decideBreakReconciliation', () => {
  it('keeps Break running before its absolute deadline', () => {
    expect(decide(300_999)).toEqual({ kind: 'running', remainingMs: 1 });
  });

  it.each([301_000, 400_000])('completes at or after deadline %s', (nowMs) => {
    expect(decide(nowMs)).toEqual({ kind: 'complete' });
  });

  it.each([
    { startedAt: -1, endsAt: 1, updatedAt: 0, nowMs: 0 },
    { startedAt: 1, endsAt: 1, updatedAt: 1, nowMs: 1 },
    { startedAt: 2, endsAt: 3, updatedAt: 1, nowMs: 2 },
    { startedAt: 1, endsAt: 3, updatedAt: 2, nowMs: 1 },
    { startedAt: 1.5, endsAt: 3, updatedAt: 2, nowMs: 2 },
  ])('rejects invalid timestamp facts', (input) => {
    expect(decideBreakReconciliation(input)).toEqual({ kind: 'invalid' });
  });
});
