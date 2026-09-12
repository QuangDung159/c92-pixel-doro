import {
  buildFocusHistorySections,
  LoadFocusHistoryPageUseCase,
  type StandardFocusHistoryQuery,
} from '@pixeldoro/application';

import { HistoryController, type CriticalRecoveryPort } from '@/application';

export interface CreateHistorySliceDependencies {
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
  return Object.freeze({
    controller,
    dispose: () => controller.dispose(),
  });
};
