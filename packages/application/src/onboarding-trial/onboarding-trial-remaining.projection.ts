export type OnboardingTrialRemainingProjection =
  | {
      readonly phase: 'running';
      readonly remainingMs: number;
      readonly displaySeconds: number;
    }
  | {
      readonly phase: 'deadline_pending';
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    };

export const createOnboardingTrialRemainingProjection = (
  endsAt: number,
  nowMs: number,
): OnboardingTrialRemainingProjection => {
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
