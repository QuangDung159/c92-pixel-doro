import { projectRemainingTime } from '@pixeldoro/domain';

export type OnboardingTrialRemainingProjection = Exclude<
  ReturnType<typeof projectRemainingTime>,
  { readonly phase: 'invalid' }
>;

export const createOnboardingTrialRemainingProjection = (
  endsAt: number,
  nowMs: number,
): OnboardingTrialRemainingProjection => {
  const projection = projectRemainingTime(endsAt, nowMs);
  return projection.phase === 'invalid'
    ? { phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0 }
    : projection;
};
