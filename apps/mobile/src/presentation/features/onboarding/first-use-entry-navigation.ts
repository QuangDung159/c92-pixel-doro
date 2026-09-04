import type {
  FirstUseEntryDestination,
  FirstUseEntryProjection,
} from '@/application';

export type FirstUseEntryPath =
  | '/(onboarding)'
  | '/focus/session'
  | '/focus/result'
  | '/(tabs)';

export type FirstUseEntryNavigationTarget =
  | FirstUseEntryPath
  | { readonly pathname: '/focus/result'; readonly params: { readonly sessionId: string } };

const paths: Record<FirstUseEntryDestination, FirstUseEntryPath> = {
  onboarding_intro: '/(onboarding)',
  trial_running: '/focus/session',
  trial_result: '/focus/result',
  standard_focus_running: '/focus/session',
  standard_focus_result: '/focus/result',
  home: '/(tabs)',
};

export const pathForFirstUseDestination = (
  destination: FirstUseEntryDestination,
): FirstUseEntryPath => paths[destination];

export const synchronizeFirstUseEntryNavigation = (
  projection: FirstUseEntryProjection,
  lastDestination: FirstUseEntryDestination | null,
  replace: (path: FirstUseEntryNavigationTarget) => void,
): FirstUseEntryDestination | null => {
  if (
    projection.status !== 'ready' ||
    projection.destination === lastDestination
  ) {
    return lastDestination;
  }

  replace(projection.destination === 'standard_focus_result'
    ? { pathname: '/focus/result', params: { sessionId: projection.sessionId } }
    : pathForFirstUseDestination(projection.destination));
  return projection.destination;
};
