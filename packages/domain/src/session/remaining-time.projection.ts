export type RemainingTimeProjection =
  | {
      readonly phase: 'running';
      readonly remainingMs: number;
      readonly displaySeconds: number;
    }
  | {
      readonly phase: 'deadline_pending';
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    }
  | {
      readonly phase: 'invalid';
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    };

const MAX_TIMESTAMP = 8_640_000_000_000_000;

const isValidTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

export const projectRemainingTime = (
  endsAt: number,
  nowMs: number,
): RemainingTimeProjection => {
  if (!isValidTimestamp(endsAt) || !isValidTimestamp(nowMs)) {
    return { phase: 'invalid', remainingMs: 0, displaySeconds: 0 };
  }
  const remainingMs = Math.max(0, endsAt - nowMs);
  if (remainingMs === 0) {
    return { phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0 };
  }
  return {
    phase: 'running',
    remainingMs,
    displaySeconds: Math.ceil(remainingMs / 1_000),
  };
};
