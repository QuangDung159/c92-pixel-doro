import {
  LONG_BREAK_DURATION_MINUTES,
  SHORT_BREAK_DURATION_MINUTES,
  type BreakRecommendation,
  type BreakSessionType,
} from './next-break-recommendation';

export interface BreakConfigurationInput {
  readonly sessionType: BreakSessionType;
  readonly durationMinutes: number;
}

export type BreakConfigurationDecision =
  | { readonly ok: true; readonly value: BreakRecommendation }
  | {
      readonly ok: false;
      readonly error: { readonly code: 'BREAK_CONFIGURATION_INVALID' };
    };

export const validateBreakConfiguration = (
  input: BreakConfigurationInput,
): BreakConfigurationDecision => {
  if (
    input.sessionType === 'short_break' &&
    input.durationMinutes === SHORT_BREAK_DURATION_MINUTES
  ) {
    return {
      ok: true,
      value: Object.freeze({
        kind: 'short',
        sessionType: 'short_break',
        durationMinutes: SHORT_BREAK_DURATION_MINUTES,
      }),
    };
  }
  if (
    input.sessionType === 'long_break' &&
    input.durationMinutes === LONG_BREAK_DURATION_MINUTES
  ) {
    return {
      ok: true,
      value: Object.freeze({
        kind: 'long',
        sessionType: 'long_break',
        durationMinutes: LONG_BREAK_DURATION_MINUTES,
      }),
    };
  }
  return {
    ok: false,
    error: Object.freeze({ code: 'BREAK_CONFIGURATION_INVALID' }),
  };
};
