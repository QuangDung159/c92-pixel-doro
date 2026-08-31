import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import type { FirstUseEntryDestination } from '@/application';
import {
  FirstUseEntryScreen,
} from '@/presentation/features/onboarding/first-use-entry-screen';
import {
  synchronizeFirstUseEntryNavigation,
} from '@/presentation/features/onboarding/first-use-entry-navigation';
import {
  useFirstUseEntryProjection,
  useFirstUseEntryRefresh,
} from '@/presentation/providers/mobile-application-context';

export default function FirstUseEntryRoute() {
  const projection = useFirstUseEntryProjection();
  const refresh = useFirstUseEntryRefresh();
  const router = useRouter();
  const lastDestination = useRef<FirstUseEntryDestination | null>(null);

  useEffect(() => {
    if (projection.status === 'idle') void refresh();
  }, [projection.status, refresh]);

  useEffect(() => {
    lastDestination.current = synchronizeFirstUseEntryNavigation(
      projection,
      lastDestination.current,
      (path) => router.replace(path),
    );
  }, [projection, router]);

  return (
    <FirstUseEntryScreen
      onRetry={() => void refresh()}
      projection={projection}
    />
  );
}
