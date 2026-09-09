import { useSyncExternalStore } from 'react';

import type { BreakRecommendationProjection } from '@/application';
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

export const useBreakRecommendationReviewStartAvailable = (): boolean =>
  useMobileApplication().breakRecommendationReviewStartAvailable;
