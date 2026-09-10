import { useEffect, useSyncExternalStore } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';

import { useMobileApplication } from '@/presentation/providers/mobile-application-context';
import { isStandardFocusNotificationDestinationCurrent } from '@/presentation/navigation/standard-focus-notification-navigation';

const NOTIFICATION_NAVIGATION_SETTLE_MS = 50;

export const StandardFocusNotificationNavigationBridge = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{
    readonly sessionId?: string | string[];
  }>();
  const { standardFocusNotificationNavigation: navigation } = useMobileApplication();
  const projection = useSyncExternalStore(
    navigation.subscribe,
    navigation.getSnapshot,
    navigation.getSnapshot,
  );

  useEffect(() => {
    if (projection.status !== 'pending') return;
    if (isStandardFocusNotificationDestinationCurrent(
      projection, pathname, params.sessionId,
    )) {
      navigation.consume(projection.requestId);
      return;
    }
    // Foreground reconciliation can already be replacing Session with this
    // Result. Let that route settle first so a notification tap cannot remount
    // the same Result and discard its one-shot Pet feedback.
    const timeout = setTimeout(() => {
      if (projection.flow === 'break' && projection.destination !== 'home') {
        router.replace({
          pathname: '/break/session',
          params: { sessionId: projection.sessionId },
        });
      } else if (projection.destination === 'result') {
        router.replace({
          pathname: '/focus/result',
          params: { sessionId: projection.sessionId },
        });
      } else if (projection.destination === 'running') {
        router.replace('/focus/session');
      } else {
        router.replace('/(tabs)');
      }
      navigation.consume(projection.requestId);
    }, NOTIFICATION_NAVIGATION_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [navigation, params.sessionId, pathname, projection, router]);

  return null;
};
