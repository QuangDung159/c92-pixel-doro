import {
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartBreakUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type ClockPort,
  type IdPort,
  type ProfileRepository,
  type RewardReceiptRepository,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

import type { TickScheduler } from '@/application';

export type BreakRunningReviewScenario =
  | 'break_running_short_fast_clock'
  | 'break_running_long_fast_clock'
  | 'break_running_relaunch_before_deadline'
  | 'break_completion_write_failure_once'
  | 'break_completion_read_failure_once'
  | 'break_cancel_short'
  | 'break_cancel_long'
  | 'break_cancel_write_failure_once'
  | 'break_cancel_read_failure_once'
  | 'break_cancel_completion_first';

interface FixtureDependencies {
  readonly installation: {
    setOnboardingCompleted(completedAt: number, updatedAt: number): Promise<unknown>;
  };
  readonly profile: ProfileRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
  readonly longBreakCadence: ConstructorParameters<typeof StartBreakUseCase>[0]['longBreakCadence'];
}

const scenarios = new Set<BreakRunningReviewScenario>([
  'break_running_short_fast_clock',
  'break_running_long_fast_clock',
  'break_running_relaunch_before_deadline',
  'break_completion_write_failure_once',
  'break_completion_read_failure_once',
  'break_cancel_short',
  'break_cancel_long',
  'break_cancel_write_failure_once',
  'break_cancel_read_failure_once',
  'break_cancel_completion_first',
]);

export const resolveBreakRunningReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): BreakRunningReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as BreakRunningReviewScenario)
    ? value as BreakRunningReviewScenario : undefined;

export const breakRunningReviewDatabaseName = (scenario: BreakRunningReviewScenario): string =>
  `pixeldoro-us-${scenario.startsWith('break_cancel_') ? '07-04' : '07-03'}-${scenario}.db`;

const focusCountFor = (scenario: BreakRunningReviewScenario): number =>
  scenario === 'break_running_long_fast_clock' || scenario === 'break_cancel_long' ? 4 : 1;

export const createBreakRunningReviewFixture = (
  scenario: BreakRunningReviewScenario | undefined,
  baseClock: ClockPort,
  delegate: SessionRepository,
) => {
  if (scenario === undefined) return undefined;
  const accelerated = scenario.includes('fast_clock') ||
    scenario.startsWith('break_completion_') || scenario === 'break_cancel_completion_first';
  let virtualNow = baseClock.nowMs() -
    focusCountFor(scenario) * ((15 * 60_000) + 1_000);
  let prepared = false;
  let seeding = false;
  let failWrite = scenario === 'break_completion_write_failure_once' ||
    scenario === 'break_cancel_write_failure_once';
  let failRead = scenario === 'break_completion_read_failure_once' ||
    scenario === 'break_cancel_read_failure_once';
  let terminalCommitted = false;
  const clock: ClockPort = { nowMs: () => {
    if (seeding) return virtualNow;
    if (!prepared || !accelerated) return baseClock.nowMs();
    return virtualNow;
  } };
  const scheduler: TickScheduler | undefined = accelerated ? {
    schedule: (callback) => {
      const timer = setTimeout(() => { virtualNow += 60_000; callback(); }, 120);
      return () => clearTimeout(timer);
    },
  } : undefined;

  const sessions: SessionRepository = {
    findById: async (id) => {
      if (terminalCommitted && failRead) {
        failRead = false;
        return { ok: false, error: persistenceError(
          'PERSISTENCE_QUERY_FAILED', 'sessions', 'review_once',
        ) };
      }
      return delegate.findById(id);
    },
    findActive: () => delegate.findActive(),
    findLatestOnboardingTrial: () => delegate.findLatestOnboardingTrial(),
    findByIdInTransaction: (scope, id) => delegate.findByIdInTransaction(scope, id),
    findActiveInTransaction: (scope) => delegate.findActiveInTransaction(scope),
    insertRunningInTransaction: (scope, record) =>
      delegate.insertRunningInTransaction(scope, record),
    recordBackgroundedAtInTransaction: (scope, input) =>
      delegate.recordBackgroundedAtInTransaction(scope, input),
    clearBackgroundedAtInTransaction: (scope, input) =>
      delegate.clearBackgroundedAtInTransaction(scope, input),
    transitionFromRunningInTransaction: async (scope, input) => {
      if ((input.status === 'completed' || input.status === 'cancelled') && failWrite) {
        failWrite = false;
        return { ok: false, error: persistenceError(
          'PERSISTENCE_WRITE_FAILED', 'sessions', 'review_once',
        ) };
      }
      const result = await delegate.transitionFromRunningInTransaction(scope, input);
      if ((input.status === 'completed' || input.status === 'cancelled') &&
        result.ok && result.value === 'updated') {
        terminalCommitted = true;
      }
      return result;
    },
  };
  const isCancelFixture = scenario.startsWith('break_cancel_');
  const breakSessionId = `${isCancelFixture ? 'us0704' : 'us0703'}-break-1`;

  const prepare = async (dependencies: FixtureDependencies): Promise<void> => {
    const existing = await delegate.findById(breakSessionId);
    if (!existing.ok) throw new Error('break_running_fixture_read_failed');
    if (existing.value !== null) {
      prepared = true;
      virtualNow = Math.max(existing.value.updatedAt, baseClock.nowMs());
      return;
    }
    seeding = true;
    try {
      const focusCount = focusCountFor(scenario);
      const ids = Array.from({ length: focusCount }, (_, index) => [
        `${isCancelFixture ? 'us0704' : 'us0703'}-focus-${index + 1}`,
        `${isCancelFixture ? 'us0704' : 'us0703'}-reward-${index + 1}`,
      ]).flat().concat(breakSessionId);
      let cursor = 0;
      const id: IdPort = { nextId: () => ids[cursor++] ??
        `${isCancelFixture ? 'us0704' : 'us0703'}-seed-${cursor}` };
      const coordinator = new SessionCommandCoordinator();
      const calendar = { snapshot: () => ({ ok: true as const,
        value: { localDate: '2026-09-10', utcOffsetMinutes: 420 } }) };
      await dependencies.installation.setOnboardingCompleted(virtualNow, virtualNow);
      let sourceFocusSessionId = '';
      for (let index = 0; index < focusCount; index += 1) {
        const focus = await new StartStandardFocusUseCase({
          calendar, clock, coordinator, id, sessions: delegate,
          transaction: dependencies.transaction,
        }).execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' });
        if (!focus.ok) throw new Error('break_running_fixture_focus_start_failed');
        sourceFocusSessionId = focus.value.session.id;
        virtualNow = focus.value.session.endsAt;
        const completed = await new ReconcileStandardFocusUseCase({
          clock, coordinator, id, profile: dependencies.profile,
          rewards: dependencies.rewards, sessions: delegate,
          transaction: dependencies.transaction,
        }).execute(sourceFocusSessionId);
        if (!completed.ok || completed.value.outcome !== 'completed') {
          throw new Error('break_running_fixture_focus_complete_failed');
        }
        virtualNow += 1_000;
      }
      const started = await new StartBreakUseCase({
        calendar, clock, coordinator, id, longBreakCadence: dependencies.longBreakCadence,
        sessions: delegate, transaction: dependencies.transaction,
      }).execute({ sourceFocusSessionId });
      if (!started.ok || started.value.session.id !== breakSessionId) {
        throw new Error('break_running_fixture_break_start_failed');
      }
      virtualNow = started.value.session.startedAt;
      prepared = true;
    } finally {
      seeding = false;
    }
  };

  return {
    scenario,
    databaseName: breakRunningReviewDatabaseName(scenario),
    breakSessionId,
    clock,
    scheduler,
    sessions,
    prepare,
  };
};
