export const STRICT_BACKGROUND_GRACE_MS = 10_000;

export type StrictReconciliationInvalidReason =
  | 'invalid_timestamp'
  | 'invalid_session_range'
  | 'background_before_start'
  | 'now_before_background'
  | 'grace_overflow';

export type StrictReconciliationDecision =
  | Readonly<{ outcome: 'running_no_evidence' }>
  | Readonly<{
      outcome: 'running_safe_clear';
      expectedBackgroundedAt: number;
      violationAt: number;
    }>
  | Readonly<{
      outcome: 'failed_due';
      expectedBackgroundedAt: number;
      violationAt: number;
    }>
  | Readonly<{ outcome: 'completion_due'; endsAt: number }>
  | Readonly<{
      outcome: 'invalid';
      reason: StrictReconciliationInvalidReason;
    }>;

export interface StrictReconciliationInput {
  readonly startedAt: number;
  readonly endsAt: number;
  readonly backgroundedAt: number | null;
  readonly now: number;
}

const isTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

const invalid = (
  reason: StrictReconciliationInvalidReason,
): StrictReconciliationDecision => Object.freeze({ outcome: 'invalid', reason });

export const decideStrictReconciliation = (
  input: StrictReconciliationInput,
): StrictReconciliationDecision => {
  if (
    !isTimestamp(input.startedAt) ||
    !isTimestamp(input.endsAt) ||
    !isTimestamp(input.now) ||
    (input.backgroundedAt !== null && !isTimestamp(input.backgroundedAt))
  ) return invalid('invalid_timestamp');
  if (input.endsAt <= input.startedAt) return invalid('invalid_session_range');
  if (input.backgroundedAt === null) {
    return input.now >= input.endsAt
      ? Object.freeze({ outcome: 'completion_due', endsAt: input.endsAt })
      : Object.freeze({ outcome: 'running_no_evidence' });
  }
  if (input.backgroundedAt < input.startedAt) {
    return invalid('background_before_start');
  }
  if (input.now < input.backgroundedAt) return invalid('now_before_background');
  const violationAt = input.backgroundedAt + STRICT_BACKGROUND_GRACE_MS;
  if (!isTimestamp(violationAt)) return invalid('grace_overflow');
  if (input.now >= violationAt && violationAt <= input.endsAt) {
    return Object.freeze({
      outcome: 'failed_due',
      expectedBackgroundedAt: input.backgroundedAt,
      violationAt,
    });
  }
  if (input.now >= input.endsAt) {
    return Object.freeze({ outcome: 'completion_due', endsAt: input.endsAt });
  }
  return Object.freeze({
    outcome: 'running_safe_clear',
    expectedBackgroundedAt: input.backgroundedAt,
    violationAt,
  });
};
