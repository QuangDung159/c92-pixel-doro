import type {
  FirstUseEntryDestination,
  FirstUseEntryProjection,
} from '@/application';

export type FirstUseEntryPath =
  | '/(onboarding)'
  | '/focus/session'
  | '/focus/result'
  | '/(tabs)';

const paths: Record<FirstUseEntryDestination, FirstUseEntryPath> = {
  onboarding_intro: '/(onboarding)',
  trial_running: '/focus/session',
  trial_result: '/focus/result',
  standard_focus_running: '/focus/session',
  home: '/(tabs)',
};

export const pathForFirstUseDestination = (
  destination: FirstUseEntryDestination,
): FirstUseEntryPath => paths[destination];

export const synchronizeFirstUseEntryNavigation = (
  projection: FirstUseEntryProjection,
  lastDestination: FirstUseEntryDestination | null,
  replace: (path: FirstUseEntryPath) => void,
): FirstUseEntryDestination | null => {
  if (
    projection.status !== 'ready' ||
    projection.destination === lastDestination
  ) {
    return lastDestination;
  }

  replace(pathForFirstUseDestination(projection.destination));
  return projection.destination;
};
