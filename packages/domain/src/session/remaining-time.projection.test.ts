import { describe, expect, it } from 'vitest';

import { projectRemainingTime } from './remaining-time.projection';

describe('projectRemainingTime', () => {
  it.each([
    [1_001, 1_000, 1, 1],
    [1_999, 1_000, 999, 1],
    [2_000, 1_000, 1_000, 1],
    [2_001, 1_000, 1_001, 2],
  ])('projects timestamp truth with ceil display', (endsAt, nowMs, remainingMs, displaySeconds) => {
    expect(projectRemainingTime(endsAt, nowMs)).toEqual({
      phase: 'running', remainingMs, displaySeconds,
    });
  });

  it.each([[1_000, 1_000], [1_000, 1_001]])(
    'projects exact and overdue boundaries as pending',
    (endsAt, nowMs) => {
      expect(projectRemainingTime(endsAt, nowMs)).toEqual({
        phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0,
      });
    },
  );

  it.each([
    [Number.NaN, 1_000], [1_000, Number.POSITIVE_INFINITY], [-1, 0], [1, -1],
  ])('fails closed for invalid timestamps', (endsAt, nowMs) => {
    expect(projectRemainingTime(endsAt, nowMs).phase).toBe('invalid');
  });
});
