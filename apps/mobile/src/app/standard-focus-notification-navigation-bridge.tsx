import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'expo-router';

import { useMobileApplication } from '@/presentation/providers/mobile-application-context';

export const StandardFocusNotificationNavigationBridge = () => {
  const router = useRouter();
  const { standardFocusNotificationNavigation: navigation } = useMobileApplication();
  const projection = useSyncExternalStore(
    navigation.subscribe,
    navigation.getSnapshot,
    navigation.getSnapshot,
  );

  useEffect(() => {
    if (projection.status !== 'pending') return;
    if (projection.destination === 'result') {
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
  }, [navigation, projection, router]);

  return null;
};
