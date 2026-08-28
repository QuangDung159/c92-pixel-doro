import {
  MobileBootstrap,
  ReadinessGate,
  type AppLifecyclePort,
  type BootstrapDataPort,
  type BootstrapVerifierPort,
  type MigrationPort,
  type StartupReconciliationPort,
} from '@/application';
import { SQLiteBootstrapDataAdapter } from '@/infrastructure/database/bootstrap/sqlite-bootstrap-data.adapter';
import { SQLiteBootstrapVerifier } from '@/infrastructure/database/bootstrap/sqlite-bootstrap-verifier';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import {
  ExpoSQLiteDriver,
  type SQLiteDriver,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';
import { ReactNativeAppLifecycleAdapter } from '@/infrastructure/platform/app-lifecycle/react-native-app-lifecycle.adapter';
import { DeviceClockAdapter } from '@/infrastructure/platform/clock/device-clock.adapter';
import { DeviceIdAdapter } from '@/infrastructure/platform/id/device-id.adapter';

import type { MobileApplication } from './mobile-application';
import { NoopStartupReconciliationAdapter } from './startup/noop-startup-reconciliation.adapter';

const PIXELDORO_DATABASE_NAME = 'pixeldoro.db';

export interface CreateMobileApplicationOptions {
  readonly appLifecycle?: AppLifecyclePort;
  readonly bootstrapData?: BootstrapDataPort;
  readonly bootstrapVerifier?: BootstrapVerifierPort;
  readonly databaseName?: string;
  readonly diagnosticsEnabled?: boolean;
  readonly migration?: MigrationPort;
  readonly sqliteDriver?: SQLiteDriver;
  readonly startupReconciliation?: StartupReconciliationPort;
}

export const createMobileApplication = (
  options: CreateMobileApplicationOptions = {},
): MobileApplication => {
  const driver = options.sqliteDriver ?? new ExpoSQLiteDriver();
  const clock = new DeviceClockAdapter();
  const id = new DeviceIdAdapter();
  const databaseOwner = new SQLiteDatabaseOwner(
    options.databaseName ?? PIXELDORO_DATABASE_NAME,
    driver,
  );
  const transaction = new SQLiteTransaction(databaseOwner);
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
    migration,
    readiness,
    startupReconciliation:
      options.startupReconciliation ??
      new NoopStartupReconciliationAdapter(),
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
  let probePromise: Promise<void> | undefined;

  const runProbeIfEnabled = (): Promise<void> => {
    if (
      !sqliteKernelProbeEnabled &&
      !initialSchemaProbeEnabled &&
      !forwardMigrationProbeEnabled &&
      !safeBootstrapProbeEnabled
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
    })();
    return probePromise;
  };

  return {
    bootstrap,
    readiness,
    transaction,
    boot: async () => {
      await runProbeIfEnabled();
      await bootstrap.boot();
    },
    dispose: () => bootstrap.dispose(),
  };
};
