import {
  StandardFocusAnalyticsRecorder,
  StandardFocusNotificationNavigationController,
  StandardFocusSideEffectCoordinator,
  type BootstrapProjection,
  type FocusCompletionNotificationPort,
  type FocusNotificationResponseSource,
} from '@/application';
import type { AnalyticsQueue } from '@/application/persistence';
import type {
  ApplicationResult,
  LoadStandardFocusResultError,
  LoadStandardFocusResultOutcome,
} from '@pixeldoro/application';

export interface CreateStandardFocusSideEffectsDependencies {
  readonly analyticsQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly notifications: FocusCompletionNotificationPort;
  readonly responses: FocusNotificationResponseSource;
  readonly readBootstrap: () => BootstrapProjection;
  readonly loadResult: (
    sessionId: string,
  ) => Promise<ApplicationResult<LoadStandardFocusResultOutcome, LoadStandardFocusResultError>>;
  readonly onNotificationSession: (sessionId: string) => Promise<void>;
  readonly onBreakNotificationSession?: (sessionId: string) => Promise<void>;
}

export const createStandardFocusSideEffects = (
  dependencies: CreateStandardFocusSideEffectsDependencies,
) => {
  const readSettings = () => {
    const projection = dependencies.readBootstrap();
    return projection.status === 'ready' ? projection.snapshot.settings : null;
  };
  const analytics = new StandardFocusAnalyticsRecorder({
    isCaptureEnabled: () => readSettings()?.analyticsEnabled === true,
    queue: dependencies.analyticsQueue,
  });
  const navigation = new StandardFocusNotificationNavigationController();
  const coordinator = new StandardFocusSideEffectCoordinator({
    analytics,
    notifications: dependencies.notifications,
    responses: dependencies.responses,
    readSettings,
    loadResult: dependencies.loadResult,
    onNotificationSession: dependencies.onNotificationSession,
    ...(dependencies.onBreakNotificationSession === undefined ? {} : {
      onBreakNotificationSession: dependencies.onBreakNotificationSession,
    }),
  });
  return Object.freeze({ analytics, coordinator, navigation });
};
