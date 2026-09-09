export interface BreakReconciliationInput {
  readonly startedAt: number;
  readonly endsAt: number;
  readonly updatedAt: number;
  readonly nowMs: number;
}

export type BreakReconciliationDecision =
  | { readonly kind: 'running'; readonly remainingMs: number }
  | { readonly kind: 'complete' }
  | { readonly kind: 'invalid' };

const MAX_TIMESTAMP = 8_640_000_000_000_000;

const isTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

export const decideBreakReconciliation = (
  input: BreakReconciliationInput,
): BreakReconciliationDecision => {
  if (
    !isTimestamp(input.startedAt) ||
    !isTimestamp(input.endsAt) ||
    !isTimestamp(input.updatedAt) ||
    !isTimestamp(input.nowMs) ||
    input.startedAt >= input.endsAt ||
    input.updatedAt < input.startedAt ||
    input.nowMs < input.updatedAt
  ) return { kind: 'invalid' };

  if (input.nowMs >= input.endsAt) return { kind: 'complete' };
  return { kind: 'running', remainingMs: input.endsAt - input.nowMs };
};
