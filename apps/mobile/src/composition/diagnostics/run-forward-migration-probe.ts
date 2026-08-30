import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type { SQLiteDriver } from '@/infrastructure/database/sqlite-driver';
import { SQLiteExecutor } from '@/infrastructure/database/sqlite-executor';
import {
  MigrationRunner,
  migrationInspectionSql,
} from '@/infrastructure/database/migration-runner';
import type { MigrationDescriptor } from '@/infrastructure/database/migrations/migration-descriptor';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

const MAIN_DATABASE = 'pixeldoro-us-02-03-migration-probe.db';
const INCOMPATIBLE_DATABASE =
  'pixeldoro-us-02-03-incompatible-probe.db';
const RETRY_DATABASE = 'pixeldoro-us-02-03-retry-probe.db';
const PROBE_DATABASES = [
  MAIN_DATABASE,
  INCOMPATIBLE_DATABASE,
  RETRY_DATABASE,
] as const;
const FIXED_TIMESTAMP = 1_787_836_800_000;
const SYNTHETIC_ONE_CHECKSUM = 'a'.repeat(64);
const SYNTHETIC_TWO_CHECKSUM = 'b'.repeat(64);

interface HistoryRow {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly applied_at: number;
}

interface MarkerRow {
  readonly marker: string;
}

export interface ForwardMigrationProbeReport {
  readonly probe: 'US-02-03_FORWARD_MIGRATION';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly assertions: readonly string[];
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  assertions: string[],
): void => {
  if (!condition) {
    throw new Error(assertion);
  }
  assertions.push(assertion);
};

const removeStaleProbeDatabase = async (
  driver: SQLiteDriver,
  databaseName: string,
): Promise<void> => {
  try {
    await driver.deleteDatabase(databaseName);
  } catch {
    // A missing isolated probe database is an acceptable starting state.
  }
};

const createRunner = (
  owner: SQLiteDatabaseOwner,
  transaction: SQLiteTransaction,
  registry: readonly MigrationDescriptor[],
) =>
  new MigrationRunner({
    owner,
    transaction,
    registry,
    clock: { nowMs: () => FIXED_TIMESTAMP },
    id: { nextId: () => 'us-02-03-probe-installation' },
  });

const readHistory = (owner: SQLiteDatabaseOwner): Promise<HistoryRow[]> =>
  owner.withConnection((connection) =>
    new SQLiteExecutor(connection).getAll<HistoryRow>(
      migrationInspectionSql.history,
      [],
    ),
  );

const readMarkers = (owner: SQLiteDatabaseOwner): Promise<MarkerRow[]> =>
  owner.withConnection((connection) =>
    new SQLiteExecutor(connection).getAll<MarkerRow>(
      'SELECT marker FROM migration_probe ORDER BY marker',
      [],
    ),
  );

const setupMissingHistory = (
  transaction: SQLiteTransaction,
): Promise<unknown> =>
  transaction.execute(async (scope) => {
    await transaction
      .executorFor(scope)
      .executeStatic('CREATE TABLE unmanaged_probe(value TEXT NOT NULL)');
    return { ok: true as const, value: undefined };
  });

const setupHistoryRows = (
  transaction: SQLiteTransaction,
  rows: readonly HistoryRow[],
): Promise<unknown> =>
  transaction.execute(async (scope) => {
    const executor = transaction.executorFor(scope);
    await executor.executeStatic(`CREATE TABLE schema_migrations (
      version INTEGER NOT NULL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )`);
    for (const row of rows) {
      await executor.run(migrationInspectionSql.insertHistory, [
        row.version,
        row.name,
        row.checksum,
        row.applied_at,
      ]);
    }
    return { ok: true as const, value: undefined };
  });

const syntheticRegistry = (
  failureMode: () => 'apply' | 'history' | 'none',
): readonly MigrationDescriptor[] => [
  {
    version: 1,
    name: 'probe-one',
    filename: '001_probe-one.migration.ts',
    checksum: SYNTHETIC_ONE_CHECKSUM,
    requiresAnonymousAnalyticsId: false,
    apply: async (executor) => {
      await executor.executeStatic(`CREATE TABLE schema_migrations (
        version INTEGER NOT NULL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )`);
      await executor.executeStatic(
        'CREATE TABLE migration_probe(marker TEXT NOT NULL UNIQUE)',
      );
      await executor.run(
        'INSERT INTO migration_probe(marker) VALUES (?)',
        ['v1'],
      );
    },
  },
  {
    version: 2,
    name: 'probe-two',
    filename: '002_probe-two.migration.ts',
    checksum: SYNTHETIC_TWO_CHECKSUM,
    requiresAnonymousAnalyticsId: false,
    apply: async (executor) => {
      await executor.run(
        'INSERT INTO migration_probe(marker) VALUES (?)',
        ['v2'],
      );
      if (failureMode() === 'apply') {
        throw new Error('injected_probe_migration_failure');
      }
      if (failureMode() === 'history') {
        await executor.run(migrationInspectionSql.insertHistory, [
          2,
          'probe-two',
          SYNTHETIC_TWO_CHECKSUM,
          FIXED_TIMESTAMP,
        ]);
      }
    },
  },
];

const replaceHistoryDatabase = async (
  driver: SQLiteDriver,
  owner: SQLiteDatabaseOwner,
  transaction: SQLiteTransaction,
  rows: readonly HistoryRow[],
): Promise<boolean> => {
  const close = await owner.close();
  if (!close.ok) {
    return false;
  }
  await driver.deleteDatabase(INCOMPATIBLE_DATABASE);
  const open = await owner.open();
  if (!open.ok) {
    return false;
  }
  await setupHistoryRows(transaction, rows);
  return true;
};

export const runForwardMigrationProbe = async (
  driver: SQLiteDriver,
): Promise<ForwardMigrationProbeReport> => {
  const assertions: string[] = [];
  const mainOwner = new SQLiteDatabaseOwner(MAIN_DATABASE, driver);
  const mainTransaction = new SQLiteTransaction(mainOwner);
  const incompatibleOwner = new SQLiteDatabaseOwner(
    INCOMPATIBLE_DATABASE,
    driver,
  );
  const incompatibleTransaction = new SQLiteTransaction(incompatibleOwner);
  const retryOwner = new SQLiteDatabaseOwner(RETRY_DATABASE, driver);
  const retryTransaction = new SQLiteTransaction(retryOwner);
  const owners = [mainOwner, incompatibleOwner, retryOwner] as const;
  let failedAssertion: string | undefined;

  try {
    await Promise.all(
      PROBE_DATABASES.map((databaseName) =>
        removeStaleProbeDatabase(driver, databaseName),
      ),
    );

    const mainOpen = await mainOwner.open();
    const mainRunner = createRunner(
      mainOwner,
      mainTransaction,
      productionMigrationRegistry,
    );
    const initialResult = await mainRunner.migrate();
    assertProbe(
      mainOpen.ok &&
        initialResult.ok &&
        initialResult.value.fromVersion === 0 &&
        initialResult.value.toVersion === 1 &&
        initialResult.value.appliedVersions.join(',') === '1',
      'empty_database_migrated_to_latest',
      assertions,
    );

    const initialHistory = await readHistory(mainOwner);
    assertProbe(
      initialHistory.length === 1 &&
        initialHistory[0]?.version === 1 &&
        initialHistory[0]?.name === productionMigrationRegistry[0]?.name &&
        initialHistory[0]?.checksum ===
          productionMigrationRegistry[0]?.checksum &&
        initialHistory[0]?.applied_at === FIXED_TIMESTAMP,
      'exact_history_committed_after_validation',
      assertions,
    );

    const rerunResult = await mainRunner.migrate();
    const rerunHistory = await readHistory(mainOwner);
    assertProbe(
      rerunResult.ok &&
        rerunResult.value.appliedVersions.length === 0 &&
        JSON.stringify(rerunHistory) === JSON.stringify(initialHistory),
      'latest_rerun_was_noop',
      assertions,
    );

    const incompatibleOpen = await incompatibleOwner.open();
    await setupMissingHistory(incompatibleTransaction);
    const incompatibleRunner = createRunner(
      incompatibleOwner,
      incompatibleTransaction,
      productionMigrationRegistry,
    );
    const missingHistory = await incompatibleRunner.migrate();
    const missingRejected =
      incompatibleOpen.ok &&
      !missingHistory.ok &&
      missingHistory.error.kind === 'migration_error' &&
      missingHistory.error.code === 'MIGRATION_HISTORY_MISSING';

    const productionOne = productionMigrationRegistry[0]!;
    const newerReady = await replaceHistoryDatabase(
      driver,
      incompatibleOwner,
      incompatibleTransaction,
      [
        {
          version: 1,
          name: productionOne.name,
          checksum: productionOne.checksum,
          applied_at: FIXED_TIMESTAMP,
        },
        {
          version: 2,
          name: 'future-schema',
          checksum: 'f'.repeat(64),
          applied_at: FIXED_TIMESTAMP + 1,
        },
      ],
    );
    const newerHistory = await incompatibleRunner.migrate();

    const checksumReady = await replaceHistoryDatabase(
      driver,
      incompatibleOwner,
      incompatibleTransaction,
      [
        {
          version: 1,
          name: productionOne.name,
          checksum: 'e'.repeat(64),
          applied_at: FIXED_TIMESTAMP,
        },
      ],
    );
    const checksumHistory = await incompatibleRunner.migrate();

    const unknownReady = await replaceHistoryDatabase(
      driver,
      incompatibleOwner,
      incompatibleTransaction,
      [
        {
          version: 1,
          name: 'unknown-one',
          checksum: productionOne.checksum,
          applied_at: FIXED_TIMESTAMP,
        },
      ],
    );
    const unknownHistory = await incompatibleRunner.migrate();

    const gapRegistry = syntheticRegistry(() => 'none');
    const gapReady = await replaceHistoryDatabase(
      driver,
      incompatibleOwner,
      incompatibleTransaction,
      [
        {
          version: 2,
          name: gapRegistry[1]!.name,
          checksum: gapRegistry[1]!.checksum,
          applied_at: FIXED_TIMESTAMP,
        },
      ],
    );
    const gapHistory = await createRunner(
      incompatibleOwner,
      incompatibleTransaction,
      gapRegistry,
    ).migrate();
    assertProbe(
      missingRejected &&
        newerReady &&
        !newerHistory.ok &&
        newerHistory.error.kind === 'migration_error' &&
        newerHistory.error.code === 'DATABASE_SCHEMA_NEWER_THAN_BINARY' &&
        checksumReady &&
        !checksumHistory.ok &&
        checksumHistory.error.kind === 'migration_error' &&
        checksumHistory.error.code === 'MIGRATION_CHECKSUM_MISMATCH' &&
        unknownReady &&
        !unknownHistory.ok &&
        unknownHistory.error.kind === 'migration_error' &&
        unknownHistory.error.code === 'MIGRATION_UNKNOWN_APPLIED' &&
        gapReady &&
        !gapHistory.ok &&
        gapHistory.error.kind === 'migration_error' &&
        gapHistory.error.code === 'MIGRATION_VERSION_GAP',
      'incompatible_history_rejected_before_write',
      assertions,
    );

    let failureMode: 'apply' | 'history' | 'none' = 'apply';
    const retryRegistry = syntheticRegistry(() => failureMode);
    const retryOpen = await retryOwner.open();
    const retryRunner = createRunner(
      retryOwner,
      retryTransaction,
      retryRegistry,
    );
    const failedRun = await retryRunner.migrate();
    const failedHistory = await readHistory(retryOwner);
    const failedMarkers = await readMarkers(retryOwner);
    assertProbe(
      retryOpen.ok &&
        !failedRun.ok &&
        failedRun.error.kind === 'migration_error' &&
        failedRun.error.code === 'MIGRATION_APPLY_FAILED' &&
        failedHistory.map(({ version }) => version).join(',') === '1' &&
        failedMarkers.map(({ marker }) => marker).join(',') === 'v1',
      'failed_migration_rolled_back_without_false_history',
      assertions,
    );

    failureMode = 'history';
    const failedHistoryWrite = await retryRunner.migrate();
    const historyWriteHistory = await readHistory(retryOwner);
    const historyWriteMarkers = await readMarkers(retryOwner);
    assertProbe(
      !failedHistoryWrite.ok &&
        failedHistoryWrite.error.kind === 'migration_error' &&
        failedHistoryWrite.error.code === 'MIGRATION_HISTORY_WRITE_FAILED' &&
        historyWriteHistory.map(({ version }) => version).join(',') === '1' &&
        historyWriteMarkers.map(({ marker }) => marker).join(',') === 'v1',
      'failed_history_write_rolled_back_without_false_history',
      assertions,
    );

    failureMode = 'none';
    const retryResult = await retryRunner.migrate();
    const retryHistory = await readHistory(retryOwner);
    const retryMarkers = await readMarkers(retryOwner);
    assertProbe(
      retryResult.ok &&
        retryResult.value.fromVersion === 1 &&
        retryResult.value.appliedVersions.join(',') === '2' &&
        retryHistory.map(({ version }) => version).join(',') === '1,2' &&
        retryMarkers.map(({ marker }) => marker).join(',') === 'v1,v2',
      'retry_resumed_from_valid_durable_history',
      assertions,
    );
    assertProbe(
      retryHistory.map(({ version }) => version).join(',') === '1,2',
      'synthetic_upgrade_applied_in_order',
      assertions,
    );

    const mainClose = await mainOwner.close();
    const mainReopen = await mainOwner.open();
    const reopenedMainHistory = await readHistory(mainOwner);
    const retryClose = await retryOwner.close();
    const retryReopen = await retryOwner.open();
    const reopenedRetryHistory = await readHistory(retryOwner);
    assertProbe(
      mainClose.ok &&
        mainReopen.ok &&
        retryClose.ok &&
        retryReopen.ok &&
        reopenedMainHistory.length === 1 &&
        reopenedRetryHistory.map(({ version }) => version).join(',') === '1,2',
      'committed_history_survived_reopen',
      assertions,
    );
  } catch (error) {
    failedAssertion =
      error instanceof Error
        ? error.message
        : 'unknown_forward_migration_probe_failure';
  } finally {
    const closeResults = await Promise.all(owners.map((owner) => owner.close()));
    if (closeResults.some((result) => !result.ok)) {
      failedAssertion ??= 'probe_database_not_closed';
    } else {
      try {
        await Promise.all(
          PROBE_DATABASES.map((databaseName) =>
            driver.deleteDatabase(databaseName),
          ),
        );
        if (failedAssertion === undefined) {
          assertions.push('probe_connections_closed_and_databases_cleaned');
        }
      } catch {
        failedAssertion ??= 'probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-03_FORWARD_MIGRATION',
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    applicationId:
      (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) ?? 'unknown',
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
    assertions,
  };
};
