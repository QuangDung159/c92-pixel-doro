import { createStandardFocusCompletionReviewFixture } from './review/standard-focus-completion-review-fixture';
import { requestStandardTerminalFeedback } from '@/application/standard-focus/request-standard-terminal-feedback';
import {
  ConfirmedLocalDataReset,
  CompleteFirstUseHandoffUseCase,
  AppVisibilityController,
  FirstUseEntryController,
  MobileBootstrap,
  OnboardingAnalyticsRecorder,
  OnboardingTrialCompletionController,
  OnboardingTrialHandoffController,
  OnboardingTrialPetFeedbackBridge,
  OnboardingTrialResultController,
  OnboardingTrialRunningController,
  ReadinessGate,
  StandardFocusLifecycleController,
  StandardFocusOutcomeController,
  type AppLifecyclePort,
  type BootstrapDataPort,
  type BootstrapVerifierPort,
  type ConfirmedResetDiagnosticsPort,
  type ConfirmedResetPersistencePort,
  type FirstUseInstallationReader,
  type FirstUseSessionReader,
  type MigrationPort,
  type OnboardingAnalyticsRecorderPort,
  type PetVisualDiagnosticsPort,
  type RecoveryDiagnosticsPort,
  type ResetNotificationCleanupPort,
  type FocusCompletionNotificationPort,
  type FocusNotificationResponseSource,
  type StandardFocusNotificationNavigationController,
  type StartupReconciliationPort,
} from '@/application';
import {
  PetCompanionController,
  PetTerminalFeedbackController,
  PetVisualController,
  CancelOnboardingTrialUseCase,
  CompleteOnboardingTrialUseCase,
  LoadOnboardingTrialResultUseCase,
  LoadStandardFocusResultUseCase,
  SessionCommandCoordinator,
  RecordStrictBackgroundUseCase,
  ReconcileStandardFocusUseCase,
  isRunningStandardFocus,
  StartOnboardingTrialUseCase,
  type ClockPort,
  type IdPort,
  type LocalCalendarPort,
  type PetCompanionSessionReader,
} from '@pixeldoro/application';
import { SQLiteBootstrapDataAdapter } from '@/infrastructure/database/bootstrap/sqlite-bootstrap-data.adapter';
import { SQLiteBootstrapVerifier } from '@/infrastructure/database/bootstrap/sqlite-bootstrap-verifier';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import {
  ExpoSQLiteDriver,
  type SQLiteDriver,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';
import { SQLiteConfirmedResetAdapter } from '@/infrastructure/database/reset/sqlite-confirmed-reset.adapter';
import { ReactNativeAppLifecycleAdapter } from '@/infrastructure/platform/app-lifecycle/react-native-app-lifecycle.adapter';
import { DeviceClockAdapter } from '@/infrastructure/platform/clock/device-clock.adapter';
import { DeviceLocalCalendarAdapter } from '@/infrastructure/platform/clock/device-local-calendar.adapter';
import { DeviceIdAdapter } from '@/infrastructure/platform/id/device-id.adapter';
import { SafeConsoleRecoveryDiagnosticsAdapter } from '@/infrastructure/platform/diagnostics/safe-console-recovery-diagnostics.adapter';
import { SafeConsoleConfirmedResetDiagnosticsAdapter } from '@/infrastructure/platform/diagnostics/safe-console-confirmed-reset-diagnostics.adapter';
import { SafeConsolePetVisualDiagnosticsAdapter } from '@/infrastructure/platform/diagnostics/safe-console-pet-visual-diagnostics.adapter';
import {
  ExpoFocusNotificationAdapter,
  ExpoNotificationGatewayAdapter,
} from '@/infrastructure/platform/notifications/expo-focus-notification.adapter';
import { DeviceTimeoutScheduler } from '@/infrastructure/platform/timing/device-timeout.scheduler';

import type { MobileApplication } from './mobile-application';
import type { Epic02ExitCompletionCandidate } from './diagnostics/run-epic-02-exit-probe';
import { createPetArbitrationReviewFixture } from './review/pet-arbitration-review-fixture';
import { createPetBaseReviewSessionReader } from './review/pet-base-review-fixture';
import { createPetTerminalReviewFixture } from './review/pet-terminal-review-fixture';
import { createFirstUseEntryReviewFixture } from './review/first-use-entry-review-fixture';
import { createOnboardingTrialReviewFixture } from './review/onboarding-trial-review-fixture';
import { createStandardFocusStartReviewFixture } from './review/standard-focus-start-review-fixture';
import { createStandardFocusSideEffectReviewFixture } from './review/standard-focus-side-effect-review-fixture';
import {
  breakCadenceReviewDatabaseName,
  createBreakCadenceReviewFixture,
  resolveBreakCadenceReviewScenario,
} from './review/break-cadence-review-fixture';
import { OnboardingTrialStartupReconciliationAdapter } from './startup/onboarding-trial-startup-reconciliation.adapter';
import { ActiveSessionStartupReconciliationAdapter } from './startup/active-session-startup-reconciliation.adapter';
import { createStandardFocusSlice } from './standard-focus/create-standard-focus-slice';
import { createBreakRecommendationSlice } from './break/create-break-recommendation-slice';
import { createStandardFocusSideEffects } from './standard-focus/create-standard-focus-side-effects';

const PIXELDORO_DATABASE_NAME = 'pixeldoro.db';

export interface CreateMobileApplicationOptions {
  readonly appLifecycle?: AppLifecyclePort;
  readonly bootstrapData?: BootstrapDataPort;
  readonly bootstrapVerifier?: BootstrapVerifierPort;
  readonly clock?: ClockPort;
  readonly confirmedResetDiagnostics?: ConfirmedResetDiagnosticsPort;
  readonly confirmedResetPersistence?: ConfirmedResetPersistencePort;
  readonly databaseName?: string;
  readonly diagnosticsEnabled?: boolean;
  readonly migration?: MigrationPort;
  readonly onboardingAnalytics?: OnboardingAnalyticsRecorderPort;
  readonly id?: IdPort;
  readonly localCalendar?: LocalCalendarPort;
  readonly firstUseInstallation?: FirstUseInstallationReader;
  readonly firstUseSessions?: FirstUseSessionReader;
  readonly focusNotifications?: FocusCompletionNotificationPort &
    FocusNotificationResponseSource & ResetNotificationCleanupPort;
  readonly petCompanionSessions?: PetCompanionSessionReader;
  readonly petVisualDiagnostics?: PetVisualDiagnosticsPort;
  readonly recoveryDiagnostics?: RecoveryDiagnosticsPort;
  readonly resetNotificationCleanup?: ResetNotificationCleanupPort;
  readonly sqliteDriver?: SQLiteDriver;
  readonly startupReconciliation?: StartupReconciliationPort;
}

export const createMobileApplication = (
  options: CreateMobileApplicationOptions = {},
): MobileApplication => {
  const driver = options.sqliteDriver ?? new ExpoSQLiteDriver();
  const baseClock = options.clock ?? new DeviceClockAdapter();
  const id = options.id ?? new DeviceIdAdapter();
  const localCalendar = options.localCalendar ?? new DeviceLocalCalendarAdapter();
  const appLifecycle =
    options.appLifecycle ?? new ReactNativeAppLifecycleAdapter();
  const baseFocusNotifications = options.focusNotifications ??
    new ExpoFocusNotificationAdapter(
      new ExpoNotificationGatewayAdapter(),
      'auto',
    );
  const appVisibility = new AppVisibilityController(
    appLifecycle.getCurrentState(),
  );
  const reviewFixturesEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__;
  const breakCadenceReviewScenario = resolveBreakCadenceReviewScenario(
    process.env.EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE,
    reviewFixturesEnabled,
  );
  const databaseOwner = new SQLiteDatabaseOwner(
    options.databaseName ?? (breakCadenceReviewScenario === undefined
      ? PIXELDORO_DATABASE_NAME
      : breakCadenceReviewDatabaseName(breakCadenceReviewScenario)),
    driver,
  );
  const transaction = new SQLiteTransaction(databaseOwner);
  const persistence = createSQLitePersistenceGraph(databaseOwner, transaction);
  const breakCadenceReviewFixture = createBreakCadenceReviewFixture(
    breakCadenceReviewScenario,
    persistence.longBreakCadence,
  );
  const breakRecommendation = createBreakRecommendationSlice({
    sessions: persistence.sessions,
    longBreakCadence: breakCadenceReviewFixture?.longBreakCadence ??
      persistence.longBreakCadence,
  });
  const standardFocusSideEffectReviewFixture =
    createStandardFocusSideEffectReviewFixture(
      process.env.EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE,
      reviewFixturesEnabled,
      baseFocusNotifications,
      persistence.analyticsQueue,
    );
  const focusNotifications = standardFocusSideEffectReviewFixture?.notifications ??
    baseFocusNotifications;
  const onboardingTrialReviewFixture = createOnboardingTrialReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE,
    reviewFixturesEnabled,
    baseClock,
    persistence.sessions,
    persistence.rewards,
    persistence.installation,
  );
  const clock = onboardingTrialReviewFixture?.clock ?? baseClock;
  const onboardingTrialSessions =
    onboardingTrialReviewFixture?.sessions ?? persistence.sessions;
  const onboardingTrialRewards =
    onboardingTrialReviewFixture?.rewards ?? persistence.rewards;
  const onboardingTrialInstallation =
    onboardingTrialReviewFixture?.installation ?? persistence.installation;
  const sessionCommands = new SessionCommandCoordinator();
  const standardFocusOutcome = new StandardFocusOutcomeController();
  const standardFocusLifecycleRef: {
    current?: StandardFocusLifecycleController;
  } = {};
  const standardFocusSideEffectsRef: {
    current?: ReturnType<typeof createStandardFocusSideEffects>['coordinator'];
  } = {};
  const notificationNavigationRef: {
    current?: StandardFocusNotificationNavigationController;
  } = {};
  const standardFocusReviewFixture = createStandardFocusStartReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE,
    reviewFixturesEnabled,
    clock,
    persistence.sessions,
  );
  const standardFocusClock = standardFocusReviewFixture?.clock ?? clock;
  const standardFocusSessions =
    standardFocusReviewFixture?.sessions ?? persistence.sessions;
  const completionReview = createStandardFocusCompletionReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE, reviewFixturesEnabled,
    persistence.profile, persistence.rewards,
  );
  const standardFocusResultLoader = new LoadStandardFocusResultUseCase({
    sessions: standardFocusSessions,
    profile: completionReview.profile,
    rewards: completionReview.resultRewards,
    transaction,
  });
  // Result reads and local analytics also use the single SQLite transaction
  // boundary. Keep them in the same queue as lifecycle commands so a
  // notification tap cannot race the foreground reconciliation transaction.
  const coordinatedStandardFocusResultLoader = {
    execute: (sessionId: string) => sessionCommands.run(
      () => standardFocusResultLoader.execute(sessionId),
    ),
  };
  const sideEffectAnalyticsQueue =
    standardFocusSideEffectReviewFixture?.analyticsQueue ?? persistence.analyticsQueue;
  const coordinatedSideEffectAnalyticsQueue = {
    enqueueBounded: (
      ...args: Parameters<typeof sideEffectAnalyticsQueue.enqueueBounded>
    ) => sessionCommands.run(() => sideEffectAnalyticsQueue.enqueueBounded(...args)),
  };
  const startupStandardReconciliation = new ReconcileStandardFocusUseCase({
    clock: standardFocusClock,
    id, profile: completionReview.profile, rewards: completionReview.rewards,
    coordinator: sessionCommands,
    sessions: standardFocusSessions,
    transaction,
  });
  const startOnboardingTrialUseCase = new StartOnboardingTrialUseCase({
    calendar: localCalendar,
    clock,
    coordinator: sessionCommands,
    id,
    sessions: onboardingTrialSessions,
    transaction,
  });
  const cancelOnboardingTrialUseCase = new CancelOnboardingTrialUseCase({
    clock,
    coordinator: sessionCommands,
    sessions: onboardingTrialSessions,
    transaction,
  });
  const loadOnboardingTrialResultUseCase = new LoadOnboardingTrialResultUseCase({
    profile: persistence.profile,
    rewards: onboardingTrialRewards,
    sessions: onboardingTrialSessions,
  });
  const onboardingTrialResult = new OnboardingTrialResultController(
    loadOnboardingTrialResultUseCase,
  );
  const completeOnboardingTrialUseCase = new CompleteOnboardingTrialUseCase({
    clock,
    coordinator: sessionCommands,
    id,
    profile: persistence.profile,
    rewards: onboardingTrialRewards,
    sessions: onboardingTrialSessions,
    transaction,
  });
  const onboardingTrialCompletion = new OnboardingTrialCompletionController(
    completeOnboardingTrialUseCase,
    onboardingTrialResult,
  );
  const sessionTickScheduler = new DeviceTimeoutScheduler();
  const onboardingTrialRunning = new OnboardingTrialRunningController({
    appInitiallyVisible: appLifecycle.getCurrentState() === 'active',
    clock,
    scheduler: sessionTickScheduler,
    sessions: onboardingTrialSessions,
    onDeadlineReached: (sessionId) => {
      void onboardingTrialCompletion.reconcile(sessionId);
      if (onboardingTrialReviewFixture?.scenario === 'trial_complete_race') {
        void onboardingTrialCompletion.reconcile(sessionId);
      }
    },
  });
  const firstUseEntryReviewFixture = createFirstUseEntryReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE,
    reviewFixturesEnabled,
  );
  const firstUseEntry = new FirstUseEntryController({
    installation:
      options.firstUseInstallation ??
      firstUseEntryReviewFixture?.installation ??
      onboardingTrialInstallation,
    sessions:
      options.firstUseSessions ??
      firstUseEntryReviewFixture?.sessions ??
      onboardingTrialSessions,
    standardOutcome: standardFocusOutcome,
  });
  const readiness = new ReadinessGate();
  const migration =
    options.migration ??
    new MigrationRunner({
      owner: databaseOwner,
      transaction,
      registry: productionMigrationRegistry,
      clock,
      id,
    });
  const bootstrap = new MobileBootstrap({
    appLifecycle,
    bootstrapData:
      options.bootstrapData ?? new SQLiteBootstrapDataAdapter(databaseOwner),
    bootstrapVerifier:
      options.bootstrapVerifier ?? new SQLiteBootstrapVerifier(databaseOwner),
    databaseLifecycle: databaseOwner,
    diagnostics:
      options.recoveryDiagnostics ??
      new SafeConsoleRecoveryDiagnosticsAdapter(),
    migration,
    readiness,
    startupReconciliation:
      options.startupReconciliation ??
      new ActiveSessionStartupReconciliationAdapter(
        new OnboardingTrialStartupReconciliationAdapter(
          onboardingTrialCompletion,
          onboardingTrialReviewFixture?.prepareForStartup === undefined
            ? undefined
            : () => onboardingTrialReviewFixture.prepareForStartup!(
                startOnboardingTrialUseCase,
                completeOnboardingTrialUseCase,
              ),
        ),
        persistence.sessions,
        {
          reconcile: () => startupStandardReconciliation.execute(),
          publishFreshCompletion: (result) => standardFocusOutcome.publishFreshCompletion(result),
          publishFreshFailure: (sessionId, resolvedAt) =>
            standardFocusOutcome.publishFreshFailure(sessionId, resolvedAt),
          ensureRunning: (session) =>
            standardFocusSideEffectsRef.current?.ensureRunning(session),
          afterTerminal: (sessionId) =>
            standardFocusSideEffectsRef.current?.afterTerminal(
              sessionId,
              'existing_terminal',
            ),
        },
      ),
  });
  const onboardingAnalytics =
    options.onboardingAnalytics ??
    new OnboardingAnalyticsRecorder({
      isCaptureEnabled: () => {
        const projection = bootstrap.getSnapshot();
        return projection.status === 'ready' &&
          projection.snapshot.settings.analyticsEnabled;
      },
      queue: persistence.analyticsQueue,
    });
  const confirmedReset = new ConfirmedLocalDataReset({
    activeSessions: persistence.sessions,
    bootstrap,
    clock,
    diagnostics:
      options.confirmedResetDiagnostics ??
      new SafeConsoleConfirmedResetDiagnosticsAdapter(),
    id,
    notificationCleanup:
      options.resetNotificationCleanup ?? focusNotifications,
    persistence:
      options.confirmedResetPersistence ??
      new SQLiteConfirmedResetAdapter(transaction),
    transaction,
  });
  const petArbitrationReviewFixture = createPetArbitrationReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE,
    reviewFixturesEnabled,
  );
  const petCompanion = new PetCompanionController(
    options.petCompanionSessions ??
      petArbitrationReviewFixture?.sessionReader ??
      createPetBaseReviewSessionReader(
        process.env.EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE,
        reviewFixturesEnabled,
      ) ??
      onboardingTrialSessions,
  );
  const petFeedbackScheduler = new DeviceTimeoutScheduler();
  const petTerminalFeedback = new PetTerminalFeedbackController({
    clock,
    scheduler: petFeedbackScheduler,
  });
  const petVisual = new PetVisualController(petCompanion, petTerminalFeedback);
  const requestStandardOutcomeFeedback = (): void => {
    requestStandardTerminalFeedback(standardFocusOutcome.getSnapshot(), petCompanion, petTerminalFeedback);
  };
  const recordStrictBackground = new RecordStrictBackgroundUseCase({
    coordinator: sessionCommands,
    sessions: standardFocusSessions,
    transaction,
  });
  const reconcileStandardFocus = startupStandardReconciliation;
  const standardFocusSideEffects = createStandardFocusSideEffects({
    analyticsQueue: coordinatedSideEffectAnalyticsQueue,
    notifications: focusNotifications,
    responses: focusNotifications,
    readBootstrap: bootstrap.getSnapshot,
    loadResult: (sessionId) => coordinatedStandardFocusResultLoader.execute(sessionId),
    onNotificationSession: async (sessionId) => {
      await bootstrap.boot();
      if (bootstrap.getSnapshot().status !== 'ready') return;
      await standardFocusLifecycleRef.current?.reconcileNow(sessionId);
      if (bootstrap.getSnapshot().status !== 'ready') return;
      const terminal = await coordinatedStandardFocusResultLoader.execute(sessionId);
      if (terminal.ok && terminal.value.outcome === 'ready') {
        notificationNavigationRef.current?.publish('result', sessionId);
        return;
      }
      const found = await standardFocusSessions.findById(sessionId);
      if (found.ok && found.value !== null && isRunningStandardFocus(found.value)) {
        notificationNavigationRef.current?.publish('running', sessionId);
      } else {
        notificationNavigationRef.current?.publish('home', sessionId);
      }
    },
  });
  standardFocusSideEffectsRef.current = standardFocusSideEffects.coordinator;
  notificationNavigationRef.current = standardFocusSideEffects.navigation;
  const standardFocus = createStandardFocusSlice({
    appInitiallyVisible: appLifecycle.getCurrentState() === 'active',
    calendar: localCalendar,
    clock: standardFocusClock,
    coordinator: sessionCommands,
    id,
    petCompanion,
    profile: completionReview.profile,
    rewards: completionReview.resultRewards,
    readiness,
    scheduler: sessionTickScheduler,
    sessions: standardFocusSessions,
    transaction,
    loadResult: coordinatedStandardFocusResultLoader,
    onDeadlineReached: (sessionId) => {
      void standardFocusLifecycleRef.current?.reconcileNow(sessionId);
    },
    onFreshFailure: (sessionId, resolvedAt) => {
      standardFocusOutcome.publishFreshFailure(sessionId, resolvedAt);
    },
    onStarted: (session) => standardFocusSideEffects.coordinator.afterStarted(session),
    onTerminal: (sessionId, freshness) =>
      standardFocusSideEffects.coordinator.afterTerminal(sessionId, freshness),
  });
  const standardFocusLifecycle = new StandardFocusLifecycleController({
    clock: standardFocusClock,
    criticalRecovery: bootstrap,
    refreshProfile: async () => (await bootstrap.refreshReadySnapshot()).ok,
    outcome: standardFocusOutcome,
    petCompanion,
    session: standardFocus.session,
    recordBackground: (capturedAt) => recordStrictBackground.execute(capturedAt),
    reconcile: (sessionId) => reconcileStandardFocus.execute(sessionId),
    onReconciled: (outcome) => {
      if (outcome.outcome === 'running') return;
      if (outcome.outcome === 'completed' || outcome.outcome === 'failed') {
        standardFocusSideEffects.coordinator.afterTerminal(
          outcome.sessionId,
          outcome.freshness,
        );
      } else if (outcome.outcome === 'terminal_winner') {
        standardFocusSideEffects.coordinator.afterTerminal(
          outcome.sessionId,
          'existing_terminal',
        );
      }
    },
  }, appLifecycle.getCurrentState());
  standardFocusLifecycleRef.current = standardFocusLifecycle;
  const completeFirstUseHandoffUseCase = new CompleteFirstUseHandoffUseCase({
    clock,
    installation: onboardingTrialInstallation,
  });
  const onboardingTrialHandoff = new OnboardingTrialHandoffController({
    bootstrap,
    completeHandoff: completeFirstUseHandoffUseCase,
    firstUseEntry,
    petCompanion,
  });
  const onboardingTrialPetFeedback = new OnboardingTrialPetFeedbackBridge({
    completion: onboardingTrialCompletion,
    petCompanion,
    petTerminalFeedback,
  });
  onboardingTrialPetFeedback.start();
  const petVisualDiagnostics =
    options.petVisualDiagnostics ?? new SafeConsolePetVisualDiagnosticsAdapter();
  const petTerminalReviewFixture = createPetTerminalReviewFixture(
    process.env.EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE,
    reviewFixturesEnabled,
  );
  const sqliteKernelProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_SQLITE_KERNEL_PROBE === '1';
  const initialSchemaProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_INITIAL_SCHEMA_PROBE === '1';
  const forwardMigrationProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_FORWARD_MIGRATION_PROBE === '1';
  const safeBootstrapProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE === '1';
  const typedRepositoriesProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE === '1';
  const derivedQueriesProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_DERIVED_QUERIES_PROBE === '1';
  const failureRecoveryProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_FAILURE_RECOVERY_PROBE === '1';
  const confirmedResetProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_CONFIRMED_RESET_PROBE === '1';
  const epic02ExitProbeEnabled =
    options.diagnosticsEnabled !== false &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_EPIC_02_EXIT_PROBE === '1';
  let probePromise: Promise<void> | undefined;
  let epic02ExitCompletion: Epic02ExitCompletionCandidate | undefined;
  let unsubscribePetLifecycle: (() => void) | undefined;
  let retryRecoveryPromise: Promise<void> | undefined;
  let reviewFixturePromise: Promise<void> | undefined;
  let cancelReviewWait: (() => void) | undefined;

  const refreshPetCompanion = async (): Promise<void> => {
    if (bootstrap.getSnapshot().status !== 'ready') return;
    await petCompanion.refresh();
  };

  const recordOnboardingAnalyticsBestEffort = (
    operation: () => Promise<unknown>,
  ): void => {
    try {
      void operation().catch(() => undefined);
    } catch {
      // Local analytics is best effort and cannot affect committed onboarding truth.
    }
  };

  const startPetLifecycleRefresh = (): void => {
    unsubscribePetLifecycle ??= appLifecycle.subscribe((state) => {
      if (state === 'background') {
        appVisibility.publish(state);
        onboardingTrialRunning.setAppVisible(false);
        standardFocusLifecycle.handleState(state);
        petTerminalFeedback.discardActive();
        return;
      }
      standardFocusLifecycle.handleState(state);
      const standardBarrier = standardFocusLifecycle.whenIdle();
      void onboardingTrialCompletion.reconcile().then(async (result) => {
        await standardBarrier;
        if (bootstrap.getSnapshot().status !== 'ready') return;
        appVisibility.publish('active');
        onboardingTrialRunning.setAppVisible(true);
        if (result.ok && result.value.outcome === 'completed_fresh') {
          await Promise.all([
            firstUseEntry.refresh(),
            onboardingTrialRunning.refresh(),
            refreshPetCompanion(),
          ]);
        } else {
          await refreshPetCompanion();
        }
      });
    });
  };

  const retryRecovery = (): Promise<void> => {
    if (retryRecoveryPromise !== undefined) return retryRecoveryPromise;
    const operation = bootstrap.retry().then(async () => {
      if (bootstrap.getSnapshot().status !== 'ready') return;
      await refreshPetCompanion();
      await firstUseEntry.refresh();
    });
    retryRecoveryPromise = operation;
    void operation.finally(() => {
      if (retryRecoveryPromise === operation) retryRecoveryPromise = undefined;
    });
    return operation;
  };

  const requestReviewTransition = (
    transition: Parameters<
      PetTerminalFeedbackController['requestFreshTransition']
    >[0],
  ) => {
    const base = petCompanion.getSnapshot();
    return petTerminalFeedback.requestFreshTransition(transition, {
      currentResultSessionId: transition.sessionId,
      activeSessionId: base.status === 'ready' ? base.activeSessionId : null,
    });
  };

  const waitForReview = (durationMs: number): Promise<void> =>
    new Promise((resolve) => {
      const cancel = petFeedbackScheduler.schedule(() => {
        cancelReviewWait = undefined;
        resolve();
      }, durationMs);
      cancelReviewWait = () => {
        cancel();
        cancelReviewWait = undefined;
        resolve();
      };
    });

  const runPetTerminalReviewFixture = async (): Promise<void> => {
    if (petArbitrationReviewFixture !== undefined) {
      for (const action of petArbitrationReviewFixture.actions) {
        if (action.kind === 'wait') {
          await waitForReview(action.durationMs);
        } else if (action.kind === 'set_base') {
          petArbitrationReviewFixture.setBaseScenario(action.scenario);
          await refreshPetCompanion();
        } else {
          requestReviewTransition(action.transition);
        }
      }
      return;
    }
    if (petTerminalReviewFixture === undefined) return;
    const first = requestReviewTransition(petTerminalReviewFixture.transition);
    if (petTerminalReviewFixture.repeat) {
      requestReviewTransition(petTerminalReviewFixture.transition);
    }
    if (petTerminalReviewFixture.reportVisualFailure && first.accepted) {
      petTerminalFeedback.reportVisualFailure(first.feedbackId);
    }
  };

  const triggerPetTerminalReviewFixture = (): Promise<void> => {
    if (reviewFixturePromise !== undefined) return reviewFixturePromise;
    const operation = runPetTerminalReviewFixture();
    reviewFixturePromise = operation;
    void operation.finally(() => {
      if (reviewFixturePromise === operation) reviewFixturePromise = undefined;
    });
    return operation;
  };

  const runProbeIfEnabled = (): Promise<void> => {
    if (
      !sqliteKernelProbeEnabled &&
      !initialSchemaProbeEnabled &&
      !forwardMigrationProbeEnabled &&
      !safeBootstrapProbeEnabled &&
      !typedRepositoriesProbeEnabled &&
      !derivedQueriesProbeEnabled &&
      !failureRecoveryProbeEnabled &&
      !confirmedResetProbeEnabled &&
      !epic02ExitProbeEnabled
    ) {
      return Promise.resolve();
    }

    probePromise ??= (async () => {
      if (epic02ExitProbeEnabled) {
        const { runEpic02ExitProbe } =
          await import('./diagnostics/run-epic-02-exit-probe');
        const execution = await runEpic02ExitProbe(driver);
        if ('kind' in execution) {
          epic02ExitCompletion = execution;
        } else {
          console.info(
            '[PixelDoro][Epic02ExitProbe]',
            JSON.stringify(execution),
          );
        }
        return;
      }

      if (sqliteKernelProbeEnabled) {
        const { runSQLiteKernelProbe } =
          await import('./diagnostics/run-sqlite-kernel-probe');
        const report = await runSQLiteKernelProbe(driver);
        console.info('[PixelDoro][SQLiteKernelProbe]', JSON.stringify(report));
      }

      if (initialSchemaProbeEnabled) {
        const { runInitialSchemaProbe } =
          await import('./diagnostics/run-initial-schema-probe');
        const report = await runInitialSchemaProbe(driver);
        console.info('[PixelDoro][InitialSchemaProbe]', JSON.stringify(report));
      }

      if (forwardMigrationProbeEnabled) {
        const { runForwardMigrationProbe } =
          await import('./diagnostics/run-forward-migration-probe');
        const report = await runForwardMigrationProbe(driver);
        console.info(
          '[PixelDoro][ForwardMigrationProbe]',
          JSON.stringify(report),
        );
      }

      if (safeBootstrapProbeEnabled) {
        const { runSafeBootstrapProbe } =
          await import('./diagnostics/run-safe-bootstrap-probe');
        const report = await runSafeBootstrapProbe(driver);
        console.info('[PixelDoro][SafeBootstrapProbe]', JSON.stringify(report));
      }

      if (typedRepositoriesProbeEnabled) {
        const { runTypedRepositoriesProbe } =
          await import('./diagnostics/run-typed-repositories-probe');
        const report = await runTypedRepositoriesProbe(driver);
        console.info('[PixelDoro][TypedRepositoriesProbe]', JSON.stringify(report));
      }

      if (derivedQueriesProbeEnabled) {
        const { runDerivedQueriesProbe } =
          await import('./diagnostics/run-derived-queries-probe');
        const report = await runDerivedQueriesProbe(driver);
        console.info('[PixelDoro][DerivedQueriesProbe]', JSON.stringify(report));
      }

      if (failureRecoveryProbeEnabled) {
        const { runFailureRecoveryProbe } =
          await import('./diagnostics/run-failure-recovery-probe');
        const report = await runFailureRecoveryProbe(driver);
        console.info('[PixelDoro][FailureRecoveryProbe]', JSON.stringify(report));
      }

      if (confirmedResetProbeEnabled) {
        const { runConfirmedResetProbe } =
          await import('./diagnostics/run-confirmed-reset-probe');
        const report = await runConfirmedResetProbe(driver);
        console.info('[PixelDoro][ConfirmedResetProbe]', JSON.stringify(report));
      }
    })();
    return probePromise;
  };

  let disposePromise: Promise<void> | undefined;

  return {
    appVisibility,
    breakRecommendation: breakRecommendation.recommendation,
    breakRecommendationReviewStartAvailable:
      breakCadenceReviewFixture !== undefined,
    bootstrap,
    confirmedReset,
    criticalRecovery: bootstrap,
    firstUseEntry,
    standardFocusSetup: standardFocus.setup,
    standardFocusSession: standardFocus.session,
    standardFocusCancel: standardFocus.cancel,
    standardFocusResult: standardFocus.result,
    standardFocusOutcome,
    requestStandardFocusOutcomeFeedback: requestStandardOutcomeFeedback,
    standardFocusNotificationNavigation: standardFocusSideEffects.navigation,
    standardFocusReviewResetAvailable: reviewFixturesEnabled,
    onboardingTrialRunning,
    onboardingTrialCompletion,
    onboardingTrialHandoff,
    onboardingTrialPetFeedback,
    onboardingTrialResult,
    petCompanion,
    petTerminalFeedback,
    petVisual,
    petTerminalReviewFixtureAvailable:
      petTerminalReviewFixture !== undefined ||
      petArbitrationReviewFixture !== undefined,
    persistence,
    readiness,
    transaction,
    boot: async () => {
      await runProbeIfEnabled();
      await bootstrap.boot();
      if (
        bootstrap.getSnapshot().status === 'ready' &&
        breakCadenceReviewFixture !== undefined
      ) {
        await breakCadenceReviewFixture.prepare({
          installation: persistence.installation,
          profile: persistence.profile,
          rewards: persistence.rewards,
          sessions: persistence.sessions,
          transaction,
        });
      }
      standardFocusSideEffects.coordinator.start();
      if (epic02ExitCompletion !== undefined) {
        const candidate = epic02ExitCompletion;
        epic02ExitCompletion = undefined;
        const { completeEpic02ExitProbe } =
          await import('./diagnostics/run-epic-02-exit-probe');
        const report = await completeEpic02ExitProbe(
          driver,
          candidate,
          bootstrap.getSnapshot().status === 'ready',
        );
        console.info('[PixelDoro][Epic02ExitProbe]', JSON.stringify(report));
      }
      if (bootstrap.getSnapshot().status === 'ready') {
        if (standardFocusReviewFixture?.prepareCommittedRelaunch === true) {
          const completedAt = clock.nowMs();
          await persistence.installation.setOnboardingCompleted(
            completedAt,
            completedAt,
          );
          await standardFocus.setup.start();
        }
        startPetLifecycleRefresh();
        await petCompanion.refresh();
        const startupOutcome = standardFocusOutcome.getSnapshot();
        if (startupOutcome.status !== 'idle') {
          standardFocusSideEffects.coordinator.afterTerminal(
            startupOutcome.sessionId,
            'fresh_commit',
          );
        }
        await firstUseEntry.refresh();
      }
    },
    cancelOnboardingTrial: async (sessionId) => {
      const allowed = readiness.run(() => cancelOnboardingTrialUseCase.execute(sessionId));
      if (!allowed.ok) return allowed;
      const result = await allowed.value;
      if (result.ok) {
        onboardingTrialCompletion.reset();
        onboardingTrialHandoff.reset();
        onboardingTrialPetFeedback.reset();
        await Promise.all([
          firstUseEntry.refresh(),
          onboardingTrialRunning.refresh(),
          refreshPetCompanion(),
        ]);
      }
      return result;
    },
    completeFirstUseHandoff: async (result) => {
      const allowed = readiness.run(() => onboardingTrialHandoff.complete(result));
      if (!allowed.ok) return allowed;
      const completed = await allowed.value;
      if (completed.ok) {
        // Do not let the completed Trial projection win arbitration when the
        // first Standard Focus route mounts immediately after onboarding.
        await onboardingTrialRunning.refresh();
        recordOnboardingAnalyticsBestEffort(() =>
          onboardingAnalytics.recordCompleted(completed.value.completedAt),
        );
      }
      return completed;
    },
    dismissPetTerminalFeedbackError: () => {
      petTerminalFeedback.dismissRecovery();
      void onboardingTrialPetFeedback.retry();
    },
    discardPetTerminalFeedback: () => petTerminalFeedback.discardActive(),
    refreshPetCompanion,
    refreshFirstUseEntry: () => firstUseEntry.refresh(),
    refreshOnboardingTrialRunning: () => onboardingTrialRunning.refresh(),
    refreshOnboardingTrialResult: () => onboardingTrialResult.refresh(),
    reconcileOnboardingTrial: (sessionId) => onboardingTrialCompletion.reconcile(sessionId),
    retryOnboardingTrialCompletion: () => onboardingTrialCompletion.retry(),
    retryOnboardingTrialPetFeedback: () => onboardingTrialPetFeedback.retry(),
    resetStandardFocusReviewData: async () => {
      if (!reviewFixturesEnabled) return false;
      const result = await confirmedReset.execute();
      if (!result.ok) return false;
      onboardingTrialCompletion.reset();
      onboardingTrialHandoff.reset();
      onboardingTrialPetFeedback.reset();
      standardFocus.setup.reset();
      standardFocusOutcome.reset();
      await Promise.all([
        firstUseEntry.refresh(),
        onboardingTrialRunning.refresh(),
        standardFocus.session.refresh(),
        refreshPetCompanion(),
      ]);
      return true;
    },
    recordPetVisualDiagnostic: (diagnostic) => {
      try {
        petVisualDiagnostics.record(diagnostic);
      } catch {
        // Visual diagnostics are best effort and cannot affect application truth.
      }
    },
    reportPetVisualComplete: (feedbackId) =>
      petTerminalFeedback.reportVisualComplete(feedbackId),
    reportPetVisualFailure: (feedbackId) =>
      petTerminalFeedback.reportVisualFailure(feedbackId),
    retryRecovery,
    startOnboardingTrial: async () => {
      const allowed = readiness.run(() => startOnboardingTrialUseCase.execute());
      if (!allowed.ok) return allowed;
      const result = await allowed.value;
      if (result.ok) {
        onboardingTrialCompletion.reset();
        onboardingTrialHandoff.reset();
        onboardingTrialPetFeedback.reset();
        await Promise.all([
          firstUseEntry.refresh(),
          onboardingTrialRunning.refresh(),
          refreshPetCompanion(),
        ]);
        recordOnboardingAnalyticsBestEffort(() =>
          onboardingAnalytics.recordStarted(
            result.value.session.id,
            result.value.session.startedAt,
          ),
        );
      }
      return result;
    },
    triggerPetTerminalReviewFixture,
    dispose: () => {
      disposePromise ??= (async () => {
        unsubscribePetLifecycle?.();
        unsubscribePetLifecycle = undefined;
        cancelReviewWait?.();
        cancelReviewWait = undefined;
        appVisibility.dispose();
        breakRecommendation.dispose();
        firstUseEntry.dispose();
        standardFocus.dispose();
        standardFocusLifecycle?.dispose();
        standardFocusOutcome.dispose();
        standardFocusSideEffects.coordinator.dispose();
        standardFocusSideEffects.navigation.dispose();
        onboardingTrialRunning.dispose();
        onboardingTrialHandoff.dispose();
        onboardingTrialPetFeedback.dispose();
        onboardingTrialCompletion.dispose();
        onboardingTrialResult.dispose();
        petVisual.dispose();
        petCompanion.dispose();
        petTerminalFeedback.dispose();
        await bootstrap.dispose();
      })();
      return disposePromise;
    },
  };
};
