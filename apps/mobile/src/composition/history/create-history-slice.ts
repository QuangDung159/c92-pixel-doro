import {
  buildFocusHistorySections,
  LoadDailyContributionUseCase,
  LoadFocusHistoryPageUseCase,
  type ClockPort,
  type ContributionQuery,
  type IdPort,
  type LocalCalendarPort,
  type StandardFocusHistoryQuery,
} from '@pixeldoro/application';

import {
  ContributionController,
  HistoryAnalyticsRecorder,
  HistoryController,
  type BootstrapProjection,
  type CriticalRecoveryPort,
} from '@/application';
import type { AnalyticsQueue } from '@/application/persistence';

export interface CreateHistorySliceDependencies {
  readonly analyticsQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly contribution: ContributionQuery;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly history: StandardFocusHistoryQuery;
  readonly id: IdPort;
  readonly readBootstrap: () => BootstrapProjection;
}

export const createHistorySlice = (
  dependencies: CreateHistorySliceDependencies,
) => {
  const analytics = new HistoryAnalyticsRecorder({
    isCaptureEnabled: () => {
      const projection = dependencies.readBootstrap();
      return projection.status === 'ready' &&
        projection.snapshot.settings.analyticsEnabled;
    },
    queue: dependencies.analyticsQueue,
  });
  const controller = new HistoryController({
    analytics,
    buildSections: buildFocusHistorySections,
    clock: dependencies.clock,
    criticalRecovery: dependencies.criticalRecovery,
    id: dependencies.id,
    loader: new LoadFocusHistoryPageUseCase({ history: dependencies.history }),
  });
  const contribution = new ContributionController({
    criticalRecovery: dependencies.criticalRecovery,
    loader: new LoadDailyContributionUseCase({
      calendar: dependencies.calendar,
      clock: dependencies.clock,
      contribution: dependencies.contribution,
    }),
  });
  return Object.freeze({
    contribution,
    controller,
    dispose: () => {
      contribution.dispose();
      controller.dispose();
    },
  });
};
