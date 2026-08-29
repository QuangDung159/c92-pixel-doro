import {
  ConfirmedLocalDataReset,
  MobileBootstrap,
  ReadinessGate,
  type AppLifecyclePort,
  type BootstrapDataPort,
  type BootstrapVerifierPort,
  type ConfirmedResetDiagnosticsPort,
  type ConfirmedResetPersistencePort,
  type MigrationPort,
  type RecoveryDiagnosticsPort,
  type ResetNotificationCleanupPort,
  type StartupReconciliationPort,
} from '@/application';
import type { ClockPort, IdPort } from '@pixeldoro/application';
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
import { DeviceIdAdapter } from '@/infrastructure/platform/id/device-id.adapter';
import { SafeConsoleRecoveryDiagnosticsAdapter } from '@/infrastructure/platform/diagnostics/safe-console-recovery-diagnostics.adapter';
import { SafeConsoleConfirmedResetDiagnosticsAdapter } from '@/infrastructure/platform/diagnostics/safe-console-confirmed-reset-diagnostics.adapter';
import { NoopResetNotificationCleanupAdapter } from '@/infrastructure/platform/notifications/noop-reset-notification-cleanup.adapter';

import type { MobileApplication } from './mobile-application';
import { NoopStartupReconciliationAdapter } from './startup/noop-startup-reconciliation.adapter';

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
  readonly id?: IdPort;
  readonly recoveryDiagnostics?: RecoveryDiagnosticsPort;
  readonly resetNotificationCleanup?: ResetNotificationCleanupPort;
  readonly sqliteDriver?: SQLiteDriver;
  readonly startupReconciliation?: StartupReconciliationPort;
}

export const createMobileApplication = (
  options: CreateMobileApplicationOptions = {},
): MobileApplication => {
  const driver = options.sqliteDriver ?? new ExpoSQLiteDriver();
  const clock = options.clock ?? new DeviceClockAdapter();
  const id = options.id ?? new DeviceIdAdapter();
  const databaseOwner = new SQLiteDatabaseOwner(
    options.databaseName ?? PIXELDORO_DATABASE_NAME,
    driver,
  );
  const transaction = new SQLiteTransaction(databaseOwner);
  const persistence = createSQLitePersistenceGraph(databaseOwner, transaction);
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
    appLifecycle:
      options.appLifecycle ?? new ReactNativeAppLifecycleAdapter(),
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
      new NoopStartupReconciliationAdapter(),
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
      options.resetNotificationCleanup ??
      new NoopResetNotificationCleanupAdapter(),
    persistence:
      options.confirmedResetPersistence ??
      new SQLiteConfirmedResetAdapter(transaction),
    transaction,
  });
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
  let probePromise: Promise<void> | undefined;

  const runProbeIfEnabled = (): Promise<void> => {
    if (
      !sqliteKernelProbeEnabled &&
      !initialSchemaProbeEnabled &&
      !forwardMigrationProbeEnabled &&
      !safeBootstrapProbeEnabled &&
      !typedRepositoriesProbeEnabled &&
      !derivedQueriesProbeEnabled &&
      !failureRecoveryProbeEnabled &&
      !confirmedResetProbeEnabled
    ) {
      return Promise.resolve();
    }

    probePromise ??= (async () => {
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

  return {
    bootstrap,
    confirmedReset,
    criticalRecovery: bootstrap,
    persistence,
    readiness,
    transaction,
    boot: async () => {
      await runProbeIfEnabled();
      await bootstrap.boot();
    },
    retryRecovery: () => bootstrap.retry(),
    dispose: () => bootstrap.dispose(),
  };
};
