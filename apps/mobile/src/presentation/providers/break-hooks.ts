import { useSyncExternalStore } from 'react';

import type {
  BreakRecommendationProjection,
  BreakSessionProjection,
  BreakStartProjection,
} from '@/application';
import { useMobileApplication } from './mobile-application-context';

export const useBreakRecommendationProjection = ():
BreakRecommendationProjection => {
  const { breakRecommendation } = useMobileApplication();
  return useSyncExternalStore(
    breakRecommendation.subscribe,
    breakRecommendation.getSnapshot,
    breakRecommendation.getSnapshot,
  );
};

export const useBreakRecommendationActions = () => {
  const { breakRecommendation } = useMobileApplication();
  return {
    refresh: breakRecommendation.refresh,
    reset: breakRecommendation.reset,
  };
};

export const useBreakStartProjection = (): BreakStartProjection => {
  const { breakStart } = useMobileApplication();
  return useSyncExternalStore(
    breakStart.subscribe,
    breakStart.getSnapshot,
    breakStart.getSnapshot,
  );
};

export const useBreakStartActions = () => {
  const { breakStart } = useMobileApplication();
  return { start: breakStart.start, reset: breakStart.reset };
};

export const useBreakSessionProjection = (): BreakSessionProjection => {
  const { breakSession } = useMobileApplication();
  return useSyncExternalStore(
    breakSession.subscribe,
    breakSession.getSnapshot,
    breakSession.getSnapshot,
  );
};

export const useBreakSessionActions = () => {
  const { breakSession } = useMobileApplication();
  return {
    activate: breakSession.activate,
    deactivate: breakSession.deactivate,
    refresh: breakSession.refresh,
    reset: breakSession.reset,
  };
};
