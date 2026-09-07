import {
  CancelStandardFocusUseCase,
  LoadStandardFocusResultUseCase,
  StartStandardFocusUseCase,
  type ClockPort,
  type IdPort,
  type LocalCalendarPort,
  type PetCompanionController,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type TransactionPort,
  type ProfileRepository,
  type RewardReceiptRepository,
  type RunningSessionRecord,
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
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly scheduler: TickScheduler;
  readonly appInitiallyVisible: boolean;
  readonly loadResult?: Pick<LoadStandardFocusResultUseCase, 'execute'>;
  readonly onDeadlineReached?: (sessionId: string) => void;
  readonly onFreshFailure?: (sessionId: string, resolvedAt: number) => void;
  readonly onStarted?: (session: RunningSessionRecord) => void;
  readonly onTerminal?: (
    sessionId: string,
    freshness: 'fresh_commit' | 'existing_terminal',
  ) => void;
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
    ...(dependencies.onDeadlineReached === undefined
      ? {}
      : { onDeadlineReached: dependencies.onDeadlineReached }),
  });
  const cancelUseCase = new CancelStandardFocusUseCase({
    clock: dependencies.clock,
    coordinator: dependencies.coordinator,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  });
  const loadResult = dependencies.loadResult ?? new LoadStandardFocusResultUseCase({
    sessions: dependencies.sessions,
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    transaction: dependencies.transaction,
  });
  const result = new StandardFocusResultController(loadResult);
  const cancel = new StandardFocusCancelController({
    cancel: async (sessionId) => {
      const allowed = dependencies.readiness.run(() => cancelUseCase.execute(sessionId));
      if (!allowed.ok) return allowed;
      const cancelled = await allowed.value;
      if (cancelled.ok) {
        const freshness = cancelled.value.outcome === 'cancelled'
          ? 'fresh_commit'
          : cancelled.value.outcome === 'failed'
            ? cancelled.value.freshness
            : 'existing_terminal';
        dependencies.onTerminal?.(cancelled.value.sessionId, freshness);
      }
      return cancelled;
    },
    refreshPet: () => dependencies.petCompanion.refresh(),
    ...(dependencies.onFreshFailure === undefined
      ? {}
      : { onFreshFailure: dependencies.onFreshFailure }),
  });
  const start = async (
    configuration: Parameters<StartStandardFocusUseCase['execute']>[0],
  ): Promise<StandardFocusSetupStartResult> => {
    const allowed = dependencies.readiness.run(() => startUseCase.execute(configuration));
    if (!allowed.ok) {
      return { ok: false, error: { code: 'START_UNAVAILABLE' } };
    }
    const startResult = await allowed.value;
    if (!startResult.ok) {
      return { ok: false, error: { code: mapStartError(startResult.error.code) } };
    }

    dependencies.onStarted?.(startResult.value.session);

    try {
      await Promise.all([session.refresh(), dependencies.petCompanion.refresh()]);
    } catch {
      return {
        ok: false,
        error: { code: 'COMMITTED_HANDOFF_UNAVAILABLE' },
      };
    }
    const handoff = session.getSnapshot();
    if (handoff.status !== 'ready' || handoff.sessionId !== startResult.value.session.id) {
      return {
        ok: false,
        error: { code: 'COMMITTED_HANDOFF_UNAVAILABLE' },
      };
    }
    return { ok: true, session: startResult.value.session };
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
