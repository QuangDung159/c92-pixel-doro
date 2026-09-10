import { describe, expect, it } from 'vitest';

import {
  decideNextBreakRecommendation,
  LONG_BREAK_CADENCE_THRESHOLD,
  LONG_BREAK_DURATION_MINUTES,
  SHORT_BREAK_DURATION_MINUTES,
} from './next-break-recommendation';

describe('decideNextBreakRecommendation', () => {
  it.each([0, 1, 2, 3])('recommends an exact Short Break for count %s', (count) => {
    expect(decideNextBreakRecommendation(count)).toEqual({
      ok: true,
      value: {
        kind: 'short',
        sessionType: 'short_break',
        durationMinutes: SHORT_BREAK_DURATION_MINUTES,
      },
    });
  });

  it.each([LONG_BREAK_CADENCE_THRESHOLD, 5, Number.MAX_SAFE_INTEGER])(
    'keeps an exact Long Break due for count %s',
    (count) => {
      expect(decideNextBreakRecommendation(count)).toEqual({
        ok: true,
        value: {
          kind: 'long',
          sessionType: 'long_break',
          durationMinutes: LONG_BREAK_DURATION_MINUTES,
        },
      });
    },
  );

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid count %s instead of guessing Short',
    (count) => {
      expect(decideNextBreakRecommendation(count)).toEqual({
        ok: false,
        error: { code: 'COMPLETED_STANDARD_FOCUS_COUNT_INVALID' },
      });
    },
  );
});
