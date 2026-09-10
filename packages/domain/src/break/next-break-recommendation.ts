export const LONG_BREAK_CADENCE_THRESHOLD = 4;
export const SHORT_BREAK_DURATION_MINUTES = 5;
export const LONG_BREAK_DURATION_MINUTES = 15;

export type BreakKind = 'short' | 'long';
export type BreakSessionType = 'short_break' | 'long_break';

export type BreakRecommendation =
  | {
      readonly kind: 'short';
      readonly sessionType: 'short_break';
      readonly durationMinutes: 5;
    }
  | {
      readonly kind: 'long';
      readonly sessionType: 'long_break';
      readonly durationMinutes: 15;
    };

export type BreakCadenceDecision =
  | { readonly ok: true; readonly value: BreakRecommendation }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'COMPLETED_STANDARD_FOCUS_COUNT_INVALID';
      };
    };

const SHORT_BREAK_RECOMMENDATION = Object.freeze({
  kind: 'short',
  sessionType: 'short_break',
  durationMinutes: SHORT_BREAK_DURATION_MINUTES,
} as const);

const LONG_BREAK_RECOMMENDATION = Object.freeze({
  kind: 'long',
  sessionType: 'long_break',
  durationMinutes: LONG_BREAK_DURATION_MINUTES,
} as const);

export const decideNextBreakRecommendation = (
  completedStandardFocusCountSinceLastCompletedLongBreak: number,
): BreakCadenceDecision => {
  if (
    !Number.isSafeInteger(completedStandardFocusCountSinceLastCompletedLongBreak) ||
    completedStandardFocusCountSinceLastCompletedLongBreak < 0
  ) {
    return {
      ok: false,
      error: Object.freeze({ code: 'COMPLETED_STANDARD_FOCUS_COUNT_INVALID' }),
    };
  }

  return {
    ok: true,
    value:
      completedStandardFocusCountSinceLastCompletedLongBreak >=
      LONG_BREAK_CADENCE_THRESHOLD
        ? LONG_BREAK_RECOMMENDATION
        : SHORT_BREAK_RECOMMENDATION,
  };
};
