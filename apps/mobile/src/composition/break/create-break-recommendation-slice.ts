import {
  LoadNextBreakRecommendationUseCase,
  type LongBreakCadenceQuery,
  type SessionRepository,
} from '@pixeldoro/application';

import { BreakRecommendationController } from '@/application';

export interface CreateBreakRecommendationSliceDependencies {
  readonly sessions: Pick<SessionRepository, 'findById'>;
  readonly longBreakCadence: LongBreakCadenceQuery;
}

export interface BreakRecommendationSlice {
  readonly recommendation: BreakRecommendationController;
  dispose(): void;
}

export const createBreakRecommendationSlice = (
  dependencies: CreateBreakRecommendationSliceDependencies,
): BreakRecommendationSlice => {
  const loadRecommendation = new LoadNextBreakRecommendationUseCase(dependencies);
  const recommendation = new BreakRecommendationController(loadRecommendation);
  return {
    recommendation,
    dispose: () => recommendation.dispose(),
  };
};
