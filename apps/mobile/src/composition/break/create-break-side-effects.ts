import { LoadBreakSessionUseCase, type SessionRepository } from '@pixeldoro/application';

import {
  BreakAnalyticsRecorder,
  BreakSideEffectCoordinator,
  type BootstrapProjection,
  type BreakCompletionNotificationPort,
} from '@/application';
import type { AnalyticsQueue } from '@/application/persistence';

export interface CreateBreakSideEffectsDependencies {
  readonly analyticsQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly notifications: BreakCompletionNotificationPort;
  readonly readBootstrap: () => BootstrapProjection;
  readonly sessions: Pick<SessionRepository, 'findById'>;
}

export const createBreakSideEffects = (dependencies: CreateBreakSideEffectsDependencies) => {
  const readSettings = () => {
    const projection = dependencies.readBootstrap();
    return projection.status === 'ready' ? projection.snapshot.settings : null;
  };
  const analytics = new BreakAnalyticsRecorder({
    isCaptureEnabled: () => readSettings()?.analyticsEnabled === true,
    queue: dependencies.analyticsQueue,
  });
  const loader = new LoadBreakSessionUseCase(dependencies.sessions);
  const coordinator = new BreakSideEffectCoordinator({
    analytics,
    notifications: dependencies.notifications,
    readSettings,
    loadSession: async (sessionId) => {
      const result = await loader.execute(sessionId);
      return result.ok ? result.value : null;
    },
  });
  return Object.freeze({ analytics, coordinator });
};
