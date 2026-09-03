import {
  CancelStandardFocusUseCase,
  LoadStandardFocusCancelledResultUseCase,
  StartStandardFocusUseCase,
  type ClockPort,
  type IdPort,
  type LocalCalendarPort,
  type PetCompanionController,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

import {
  StandardFocusCancelController,
  StandardFocusResultController,
  StandardFocusSessionController,
  StandardFocusSetupController,
  type CommandReadinessPort,
  type StandardFocusSetupErrorCode,
  type StandardFocusSetupStartResult,
  type TickScheduler,
} from '@/application';

export interface CreateStandardFocusSliceDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly petCompanion: PetCompanionController;
  readonly readiness: CommandReadinessPort;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
  readonly scheduler: TickScheduler;
  readonly appInitiallyVisible: boolean;
}

export interface StandardFocusSlice {
  readonly setup: StandardFocusSetupController;
  readonly session: StandardFocusSessionController;
  readonly cancel: StandardFocusCancelController;
  readonly result: StandardFocusResultController;
  dispose(): void;
}

const mapStartError = (code: string): StandardFocusSetupErrorCode => {
  if (code === 'STANDARD_FOCUS_CONFIG_INVALID') return 'INVALID_CONFIGURATION';
  if (code === 'SESSION_START_CONFLICT') return 'ACTIVE_SESSION';
  return 'START_UNAVAILABLE';
};

export const createStandardFocusSlice = (
  dependencies: CreateStandardFocusSliceDependencies,
): StandardFocusSlice => {
  const startUseCase = new StartStandardFocusUseCase({
    calendar: dependencies.calendar,
    clock: dependencies.clock,
    coordinator: dependencies.coordinator,
    id: dependencies.id,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  });
  const session = new StandardFocusSessionController({
    appInitiallyVisible: dependencies.appInitiallyVisible,
    clock: dependencies.clock,
    scheduler: dependencies.scheduler,
    sessions: dependencies.sessions,
  });
  const cancelUseCase = new CancelStandardFocusUseCase({
    clock: dependencies.clock,
    coordinator: dependencies.coordinator,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  });
  const result = new StandardFocusResultController(
    new LoadStandardFocusCancelledResultUseCase({ sessions: dependencies.sessions }),
  );
  const cancel = new StandardFocusCancelController({
    cancel: async (sessionId) => {
      const allowed = dependencies.readiness.run(() => cancelUseCase.execute(sessionId));
      return allowed.ok ? allowed.value : allowed;
    },
    refreshPet: () => dependencies.petCompanion.refresh(),
  });
  const start = async (
    configuration: Parameters<StartStandardFocusUseCase['execute']>[0],
  ): Promise<StandardFocusSetupStartResult> => {
    const allowed = dependencies.readiness.run(() => startUseCase.execute(configuration));
    if (!allowed.ok) {
      return { ok: false, error: { code: 'START_UNAVAILABLE' } };
    }
    const result = await allowed.value;
    if (!result.ok) {
      return { ok: false, error: { code: mapStartError(result.error.code) } };
    }

    try {
      await Promise.all([session.refresh(), dependencies.petCompanion.refresh()]);
    } catch {
      return {
        ok: false,
        error: { code: 'COMMITTED_HANDOFF_UNAVAILABLE' },
      };
    }
    const handoff = session.getSnapshot();
    if (handoff.status !== 'ready' || handoff.sessionId !== result.value.session.id) {
      return {
        ok: false,
        error: { code: 'COMMITTED_HANDOFF_UNAVAILABLE' },
      };
    }
    return { ok: true, session: result.value.session };
  };
  const setup = new StandardFocusSetupController({ start });

  return {
    setup,
    session,
    cancel,
    result,
    dispose: () => {
      setup.dispose();
      session.dispose();
      cancel.dispose();
      result.dispose();
    },
  };
};
