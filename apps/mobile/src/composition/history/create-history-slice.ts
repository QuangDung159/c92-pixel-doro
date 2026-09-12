import {
  buildFocusHistorySections,
  LoadDailyContributionUseCase,
  LoadFocusHistoryPageUseCase,
  type ClockPort,
  type ContributionQuery,
  type LocalCalendarPort,
  type StandardFocusHistoryQuery,
} from '@pixeldoro/application';

import {
  ContributionController,
  HistoryController,
  type CriticalRecoveryPort,
} from '@/application';

export interface CreateHistorySliceDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly contribution: ContributionQuery;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly history: StandardFocusHistoryQuery;
}

export const createHistorySlice = (
  dependencies: CreateHistorySliceDependencies,
) => {
  const controller = new HistoryController({
    buildSections: buildFocusHistorySections,
    criticalRecovery: dependencies.criticalRecovery,
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
