import type {
  OnboardingTrialCompletionProjection,
  OnboardingTrialRunningProjection,
  StandardFocusSessionProjection,
} from '@/application';

export type FocusSessionBranch =
  | 'loading'
  | 'trial_error'
  | 'trial'
  | 'standard_error'
  | 'standard'
  | 'prototype';

export const shouldOpenOnboardingTrialResult = (
  branch: FocusSessionBranch,
  completionStatus: OnboardingTrialCompletionProjection['status'],
): boolean => branch === 'trial' && completionStatus === 'committed';

export const decideFocusSessionBranch = (
  trial: OnboardingTrialRunningProjection,
  standard: StandardFocusSessionProjection,
): FocusSessionBranch => {
  if (
    trial.status === 'idle' ||
    trial.status === 'loading' ||
    standard.status === 'idle' ||
    standard.status === 'loading'
  ) return 'loading';
  if (trial.status === 'error') return 'trial_error';
  if (trial.status === 'ready') return 'trial';
  if (standard.status === 'error') return 'standard_error';
  if (standard.status === 'ready') return 'standard';
  return 'prototype';
};
