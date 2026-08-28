import { CreateFoundationSnapshotUseCase } from "@pixeldoro/application";

import { MobileBootstrap } from "@/application";
import { SQLiteDatabaseOwner } from "@/infrastructure/database/sqlite-database-owner";
import {
  ExpoSQLiteDriver,
  type SQLiteDriver,
} from "@/infrastructure/database/sqlite-driver";
import { SQLiteTransaction } from "@/infrastructure/database/sqlite-transaction";
import { NoopAppLifecycleAdapter } from "@/infrastructure/platform/app-lifecycle/noop-app-lifecycle.adapter";
import { DeviceClockAdapter } from "@/infrastructure/platform/clock/device-clock.adapter";
import { DeviceIdAdapter } from "@/infrastructure/platform/id/device-id.adapter";

import type { MobileApplication } from "./mobile-application";

const PIXELDORO_DATABASE_NAME = "pixeldoro.db";

export interface CreateMobileApplicationOptions {
  readonly databaseName?: string;
  readonly sqliteDriver?: SQLiteDriver;
}

export const createMobileApplication = (
  options: CreateMobileApplicationOptions = {},
): MobileApplication => {
  const appLifecycle = new NoopAppLifecycleAdapter();
  const clock = new DeviceClockAdapter();
  const id = new DeviceIdAdapter();
  const databaseOwner = new SQLiteDatabaseOwner(
    options.databaseName ?? PIXELDORO_DATABASE_NAME,
    options.sqliteDriver ?? new ExpoSQLiteDriver(),
  );
  const transaction = new SQLiteTransaction(databaseOwner);
  const createFoundationSnapshot = new CreateFoundationSnapshotUseCase({
    clock,
    id,
  });
  const bootstrap = new MobileBootstrap({
    appLifecycle,
    createFoundationSnapshot,
    databaseLifecycle: databaseOwner,
  });
  const sqliteKernelProbeEnabled =
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_SQLITE_KERNEL_PROBE === "1";
  const initialSchemaProbeEnabled =
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_INITIAL_SCHEMA_PROBE === "1";
  const forwardMigrationProbeEnabled =
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_FORWARD_MIGRATION_PROBE === "1";
  let probePromise: Promise<void> | undefined;

  const runProbeIfEnabled = (): Promise<void> => {
    if (
      !sqliteKernelProbeEnabled &&
      !initialSchemaProbeEnabled &&
      !forwardMigrationProbeEnabled
    ) {
      return Promise.resolve();
    }

    probePromise ??= (async () => {
      if (sqliteKernelProbeEnabled) {
        const { runSQLiteKernelProbe } =
          await import("./diagnostics/run-sqlite-kernel-probe");
        const report = await runSQLiteKernelProbe(
          options.sqliteDriver ?? new ExpoSQLiteDriver(),
        );
        console.info("[PixelDoro][SQLiteKernelProbe]", JSON.stringify(report));
      }

      if (initialSchemaProbeEnabled) {
        const { runInitialSchemaProbe } =
          await import("./diagnostics/run-initial-schema-probe");
        const report = await runInitialSchemaProbe(
          options.sqliteDriver ?? new ExpoSQLiteDriver(),
        );
        console.info("[PixelDoro][InitialSchemaProbe]", JSON.stringify(report));
      }

      if (forwardMigrationProbeEnabled) {
        const { runForwardMigrationProbe } =
          await import("./diagnostics/run-forward-migration-probe");
        const report = await runForwardMigrationProbe(
          options.sqliteDriver ?? new ExpoSQLiteDriver(),
        );
        console.info(
          "[PixelDoro][ForwardMigrationProbe]",
          JSON.stringify(report),
        );
      }
    })();
    return probePromise;
  };

  return {
    bootstrap,
    transaction,
    boot: async () => {
      await runProbeIfEnabled();
      await bootstrap.boot();
    },
    dispose: () => bootstrap.dispose(),
  };
};
