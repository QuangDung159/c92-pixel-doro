export interface BreakCancellationInput {
  readonly startedAt: number;
  readonly endsAt: number;
  readonly capturedAt: number;
}

export type BreakCancellationDecision =
  | { readonly kind: 'cancel_allowed' }
  | { readonly kind: 'completion_due' }
  | { readonly kind: 'invalid' };

const MAX_TIMESTAMP = 8_640_000_000_000_000;
const isTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

export const decideBreakCancellation = (
  input: BreakCancellationInput,
): BreakCancellationDecision => {
  if (!isTimestamp(input.startedAt) || !isTimestamp(input.endsAt) ||
    !isTimestamp(input.capturedAt) || input.startedAt >= input.endsAt ||
    input.capturedAt < input.startedAt) return { kind: 'invalid' };
  return input.capturedAt >= input.endsAt
    ? { kind: 'completion_due' }
    : { kind: 'cancel_allowed' };
};
