export const STANDARD_FOCUS_MIN_DURATION_MINUTES = 15;
export const STANDARD_FOCUS_MAX_DURATION_MINUTES = 120;
export const STANDARD_FOCUS_DURATION_STEP_MINUTES = 5;

export const STANDARD_FOCUS_MODES = Object.freeze(['relax', 'strict'] as const);
export const STANDARD_FOCUS_WORK_TAGS = Object.freeze([
  'coding',
  'study',
  'writing',
  'reading',
] as const);

export type FocusMode = (typeof STANDARD_FOCUS_MODES)[number];
export type WorkTag = (typeof STANDARD_FOCUS_WORK_TAGS)[number];

export interface StandardFocusConfiguration {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

export interface StandardFocusConfigurationInput {
  readonly durationMinutes: unknown;
  readonly mode: unknown;
  readonly workTag: unknown;
}

export type StandardFocusConfigurationErrorCode =
  | 'DURATION_INVALID'
  | 'MODE_INVALID'
  | 'WORK_TAG_INVALID';

export type StandardFocusConfigurationDecision =
  | { readonly ok: true; readonly value: StandardFocusConfiguration }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: StandardFocusConfigurationErrorCode;
      };
    };

const invalid = (
  code: StandardFocusConfigurationErrorCode,
): StandardFocusConfigurationDecision => ({
  ok: false,
  error: Object.freeze({ code }),
});

const isFocusMode = (value: unknown): value is FocusMode =>
  typeof value === 'string' &&
  STANDARD_FOCUS_MODES.some((mode) => mode === value);

const isWorkTag = (value: unknown): value is WorkTag =>
  typeof value === 'string' &&
  STANDARD_FOCUS_WORK_TAGS.some((tag) => tag === value);

export const validateStandardFocusConfiguration = (
  input: StandardFocusConfigurationInput,
): StandardFocusConfigurationDecision => {
  if (
    !Number.isSafeInteger(input.durationMinutes) ||
    (input.durationMinutes as number) < STANDARD_FOCUS_MIN_DURATION_MINUTES ||
    (input.durationMinutes as number) > STANDARD_FOCUS_MAX_DURATION_MINUTES ||
    (input.durationMinutes as number) % STANDARD_FOCUS_DURATION_STEP_MINUTES !== 0
  ) {
    return invalid('DURATION_INVALID');
  }
  if (!isFocusMode(input.mode)) return invalid('MODE_INVALID');
  if (!isWorkTag(input.workTag)) return invalid('WORK_TAG_INVALID');

  return {
    ok: true,
    value: Object.freeze({
      durationMinutes: input.durationMinutes as number,
      mode: input.mode,
      workTag: input.workTag,
    }),
  };
};
