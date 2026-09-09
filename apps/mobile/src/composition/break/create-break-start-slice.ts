import {
  LoadBreakSessionUseCase,
  StartBreakUseCase,
  type ClockPort,
  type IdPort,
  type LocalCalendarPort,
  type PetCompanionController,
  type PetTerminalFeedbackController,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type TransactionalLongBreakCadenceQuery,
  type TransactionPort,
} from '@pixeldoro/application';

import {
  BreakSessionController,
  BreakStartController,
  type CommandReadinessPort,
  type BreakStartUiErrorCode,
  type TickScheduler,
} from '@/application';

export interface CreateBreakStartSliceDependencies {
  readonly calendar: LocalCalendarPort;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly id: IdPort;
  readonly longBreakCadence: TransactionalLongBreakCadenceQuery;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly readiness: CommandReadinessPort;
  readonly sessions: Pick<SessionRepository,
    'findById' | 'findByIdInTransaction' | 'findActiveInTransaction' |
    'insertRunningInTransaction'>;
  readonly transaction: TransactionPort;
  readonly scheduler: TickScheduler;
  readonly appInitiallyVisible: boolean;
  readonly onDeadlineReached?: (sessionId: string) => void;
  readonly onStarted?: () => void;
}

const mapError = (code: string): BreakStartUiErrorCode => {
  if (code === 'BREAK_SOURCE_INELIGIBLE') return 'SOURCE_UNAVAILABLE';
  if (code === 'SESSION_START_CONFLICT') return 'ACTIVE_SESSION';
  return 'START_UNAVAILABLE';
};

export const createBreakStartSlice = (dependencies: CreateBreakStartSliceDependencies) => {
  const startUseCase = new StartBreakUseCase({
    calendar: dependencies.calendar,
    clock: dependencies.clock,
    coordinator: dependencies.coordinator,
    id: dependencies.id,
    longBreakCadence: dependencies.longBreakCadence,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  });
  const start = new BreakStartController({
    start: async (sourceFocusSessionId) => {
      const allowed = dependencies.readiness.run(() =>
        startUseCase.execute({ sourceFocusSessionId }));
      if (!allowed.ok) return { ok: false, error: { code: 'START_UNAVAILABLE' } };
      const result = await allowed.value;
      return result.ok
        ? { ok: true, session: result.value.session }
        : { ok: false, error: { code: mapError(result.error.code) } };
    },
    afterCommitted: async () => {
      dependencies.onStarted?.();
      dependencies.petTerminalFeedback.discardActive();
      await dependencies.petCompanion.refresh();
    },
  });
  const session = new BreakSessionController({
    appInitiallyVisible: dependencies.appInitiallyVisible,
    clock: dependencies.clock,
    loader: new LoadBreakSessionUseCase(dependencies.sessions),
    scheduler: dependencies.scheduler,
    ...(dependencies.onDeadlineReached === undefined
      ? {} : { onDeadlineReached: dependencies.onDeadlineReached }),
  });
  return {
    start,
    session,
    dispose: () => {
      start.dispose();
      session.dispose();
    },
  };
};
