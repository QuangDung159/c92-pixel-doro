import type { StandardFocusNotificationDestination } from '@/application';

const firstParam = (value: string | readonly string[] | undefined): string | undefined =>
  typeof value === 'string' ? value : value?.[0];

export const isStandardFocusNotificationDestinationCurrent = (
  projection: StandardFocusNotificationDestination,
  pathname: string,
  routeSessionId: string | readonly string[] | undefined,
): boolean => {
  if (projection.status !== 'pending') return true;
  if (projection.flow === 'break') {
    if (projection.destination === 'home') return pathname === '/' || pathname === '/(tabs)';
    return pathname === '/break/session' && firstParam(routeSessionId) === projection.sessionId;
  }
  if (projection.destination === 'result') {
    return pathname === '/focus/result' &&
      firstParam(routeSessionId) === projection.sessionId;
  }
  if (projection.destination === 'running') return pathname === '/focus/session';
  return pathname === '/' || pathname === '/(tabs)';
};
