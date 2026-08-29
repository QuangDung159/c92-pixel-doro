import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  AnalyticsEventRecord,
  RecoveryDiagnostic,
} from '@/application';
import { INITIAL_SCHEMA_TABLES } from '@/infrastructure/database/migrations/schema-manifest';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteExecutor } from '@/infrastructure/database/sqlite-executor';

import { createMobileApplication } from '../create-mobile-application';
import type { MobileApplication } from '../mobile-application';

const PROBE_DATABASE = 'pixeldoro-us-02-07-failure-recovery-probe.db';
const BASE_TIMESTAMP = 1_787_836_800_000;
const TTL_MS = 604_800_000;

export interface FailureRecoveryProbeReport {
  readonly probe: 'US-02-07_FAILURE_RECOVERY';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly sqliteVersion: string;
  readonly assertions: readonly string[];
}

class FaultInjectingConnection {
  constructor(
    private readonly connection: SQLiteConnection,
    private readonly driver: FaultInjectingDriver,
  ) {}

  closeAsync(): Promise<void> {
    return this.connection.closeAsync();
  }

  execAsync(sql: string): Promise<void> {
    return this.connection.execAsync(sql);
  }

  runAsync(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<SQLiteWriteResult> {
    return this.connection.runAsync(sql, parameters);
  }

  getFirstAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    return this.connection.getFirstAsync<TRow>(sql, parameters);
  }

  getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    if (sql === 'PRAGMA integrity_check' && this.driver.failIntegrityReads > 0) {
      this.driver.failIntegrityReads -= 1;
      return Promise.reject(new Error('native sqlite detail must be sanitized'));
    }
    return this.connection.getAllAsync<TRow>(sql, parameters);
  }
}

class FaultInjectingDriver implements SQLiteDriver {
  failIntegrityReads = 0;
  readonly openedDatabaseNames: string[] = [];

  constructor(private readonly driver: SQLiteDriver) {}

  async openDatabase(databaseName: string): Promise<SQLiteConnection> {
    this.openedDatabaseNames.push(databaseName);
    return new FaultInjectingConnection(
      await this.driver.openDatabase(databaseName),
      this,
    ) as unknown as SQLiteConnection;
  }

  deleteDatabase(databaseName: string): Promise<void> {
    return this.driver.deleteDatabase(databaseName);
  }
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  assertions: string[],
): void => {
  if (!condition) throw new Error(assertion);
  assertions.push(assertion);
};

const removeStaleDatabase = async (driver: SQLiteDriver): Promise<void> => {
  try {
    await driver.deleteDatabase(PROBE_DATABASE);
  } catch {
    // Missing isolated probe state is a valid starting point.
  }
};

const createProbeApplication = (
  driver: SQLiteDriver,
  diagnostics: RecoveryDiagnostic[],
): MobileApplication =>
  createMobileApplication({
    databaseName: PROBE_DATABASE,
    diagnosticsEnabled: false,
    recoveryDiagnostics: {
      record: (diagnostic) => diagnostics.push(diagnostic),
    },
    sqliteDriver: driver,
    appLifecycle: {
      getCurrentState: () => 'active',
      subscribe: () => () => undefined,
    },
  });

const readWithTransaction = async <TValue>(
  application: MobileApplication,
  work: (executor: SQLiteExecutor) => Promise<TValue>,
): Promise<TValue> => {
  const result = await application.transaction.execute(async (scope) => ({
    ok: true as const,
    value: await work(application.transaction.executorFor(scope)),
  }));
  if (!result.ok) throw new Error('failure_recovery_probe_read_failed');
  return result.value;
};

const fingerprint = (application: MobileApplication): Promise<string> =>
  readWithTransaction(application, async (executor) => {
    const objects = await executor.getAll<unknown>(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name NOT LIKE 'sqlite_%'
       ORDER BY type, name`,
      [],
    );
    const rows: Record<string, readonly unknown[]> = {};
    for (const table of INITIAL_SCHEMA_TABLES) {
      rows[table] = await executor.getAll<unknown>(
        `SELECT * FROM ${table} ORDER BY rowid`,
        [],
      );
    }
    return JSON.stringify({ objects, rows });
  });

const readSafetyCounts = (application: MobileApplication) =>
  readWithTransaction(application, (executor) =>
    executor.getFirst<{
      readonly migrationCount: number;
      readonly catalogCount: number;
      readonly sessionCount: number;
      readonly rewardCount: number;
      readonly totalXp: number;
      readonly coinBalance: number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM schema_migrations) AS migrationCount,
        (SELECT COUNT(*) FROM catalog_items) AS catalogCount,
        (SELECT COUNT(*) FROM sessions) AS sessionCount,
        (SELECT COUNT(*) FROM reward_transactions) AS rewardCount,
        (SELECT total_xp FROM pet_profiles WHERE id = 1) AS totalXp,
        (SELECT coin_balance FROM pet_profiles WHERE id = 1) AS coinBalance`,
      [],
    ),
  );

const insertRetainedSession = async (
  application: MobileApplication,
): Promise<void> => {
  const result = await application.transaction.execute(async (scope) => {
    const inserted = await application.persistence.sessions.insertRunningInTransaction(
      scope,
      {
        id: 'failure-recovery-retained-session',
        profileId: 1,
        sessionType: 'focus',
        focusVariant: 'standard',
        mode: 'relax',
        status: 'running',
        workTag: 'coding',
        configuredDurationMinutes: 25,
        startedAt: BASE_TIMESTAMP,
        endsAt: BASE_TIMESTAMP + 1_500_000,
        backgroundedAt: null,
        resolvedAt: null,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        scheduledEndLocalDate: '2026-08-28',
        scheduledEndUtcOffsetMinutes: 420,
        createdAt: BASE_TIMESTAMP,
        updatedAt: BASE_TIMESTAMP,
      },
    );
    if (!inserted.ok) return inserted;
    return application.persistence.sessions.transitionFromRunningInTransaction(
      scope,
      {
        sessionId: 'failure-recovery-retained-session',
        status: 'cancelled',
        resolvedAt: BASE_TIMESTAMP + 60_000,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        updatedAt: BASE_TIMESTAMP + 60_000,
      },
    );
  });
  if (!result.ok) throw new Error('failure_recovery_probe_seed_failed');
};

const invalidSideEffectEvent = (): AnalyticsEventRecord =>
  ({
    eventId: 'failure-recovery-forbidden-event',
    eventName: 'history_viewed',
    properties: { comment: 'must-not-persist' },
    occurredAt: BASE_TIMESTAMP,
    expiresAt: BASE_TIMESTAMP + TTL_MS,
    deliveryState: 'pending',
    attemptCount: 0,
    nextAttemptAt: null,
    createdAt: BASE_TIMESTAMP,
  }) as unknown as AnalyticsEventRecord;

const disposeSafely = async (
  applications: readonly MobileApplication[],
): Promise<boolean> => {
  const results = await Promise.allSettled(
    applications.map((application) => application.dispose()),
  );
  return results.every((result) => result.status === 'fulfilled');
};

export const runFailureRecoveryProbe = async (
  baseDriver: SQLiteDriver,
): Promise<FailureRecoveryProbeReport> => {
  const assertions: string[] = [];
  const applications: MobileApplication[] = [];
  const driver = new FaultInjectingDriver(baseDriver);
  const diagnostics: RecoveryDiagnostic[] = [];
  let failedAssertion: string | undefined;
  let sqliteVersion = 'unavailable';

  try {
    await removeStaleDatabase(driver);

    const seedApplication = createProbeApplication(driver, diagnostics);
    applications.push(seedApplication);
    await seedApplication.boot();
    if (seedApplication.bootstrap.getSnapshot().status !== 'ready') {
      throw new Error('failure_recovery_probe_seed_boot_failed');
    }
    await insertRetainedSession(seedApplication);
    sqliteVersion = await readWithTransaction(seedApplication, async (executor) => {
      const row = await executor.getFirst<{ readonly version: string }>(
        'SELECT sqlite_version() AS version',
        [],
      );
      return row?.version ?? 'unavailable';
    });
    await seedApplication.dispose();

    driver.failIntegrityReads = 1;
    const recoveredApplication = createProbeApplication(driver, diagnostics);
    applications.push(recoveredApplication);
    const phaseTrace: string[] = [];
    recoveredApplication.bootstrap.subscribe(() => {
      const projection = recoveredApplication.bootstrap.getSnapshot();
      if (projection.status === 'booting') phaseTrace.push(projection.phase);
      if (projection.status === 'ready') phaseTrace.push('ready');
    });
    await recoveredApplication.boot();
    const recoveryProjection = recoveredApplication.bootstrap.getSnapshot();
    const initialCounts = await readSafetyCounts(recoveredApplication);
    assertProbe(
      recoveryProjection.status === 'recovery' &&
        initialCounts?.migrationCount === 1 &&
        initialCounts.catalogCount === 12,
      'recovery_probe_database_opened_and_migrated',
      assertions,
    );
    assertProbe(
      recoveryProjection.status === 'recovery' &&
        recoveryProjection.error.code === 'DATABASE_READ_FAILED' &&
        diagnostics.length === 1 &&
        Object.keys(diagnostics[0] ?? {}).sort().join(',') ===
          'attemptNumber,eventName,phase,reasonCode' &&
        !JSON.stringify(diagnostics).includes('native sqlite detail'),
      'typed_failure_reason_was_sanitized',
      assertions,
    );
    assertProbe(
      recoveryProjection.status === 'recovery' &&
        !('snapshot' in recoveryProjection) &&
        !recoveredApplication.readiness.run(() => 'forbidden').ok,
      'failure_closed_readiness_and_hid_core_projection',
      assertions,
    );

    const beforeRetry = await fingerprint(recoveredApplication);
    assertProbe(
      initialCounts?.sessionCount === 1 && initialCounts.rewardCount === 0,
      'durable_rows_survived_injected_failure',
      assertions,
    );
    const firstRetry = recoveredApplication.retryRecovery();
    const secondRetry = recoveredApplication.retryRecovery();
    assertProbe(
      firstRetry === secondRetry,
      'concurrent_retry_coalesced_to_one_attempt',
      assertions,
    );
    await Promise.all([firstRetry, secondRetry]);
    const readyProjection = recoveredApplication.bootstrap.getSnapshot();
    const expectedTrace =
      'opening,migrating,verifying,opening,migrating,verifying,hydrating,reconciling,ready';
    assertProbe(
      driver.openedDatabaseNames.every((name) => name === PROBE_DATABASE) &&
        phaseTrace.join(',') === expectedTrace &&
        (await fingerprint(recoveredApplication)) === beforeRetry,
      'retry_reused_same_database_and_reran_ordered_barrier',
      assertions,
    );
    assertProbe(
      readyProjection.status === 'ready' &&
        readyProjection.snapshot.catalog.length === 12 &&
        recoveredApplication.readiness.run(() => 'ready').ok,
      'successful_retry_hydrated_fresh_snapshot_before_ready',
      assertions,
    );

    const rejected = await recoveredApplication.persistence.analyticsQueue.enqueueBounded(
      invalidSideEffectEvent(),
      BASE_TIMESTAMP,
    );
    assertProbe(
      !rejected.ok &&
        recoveredApplication.bootstrap.getSnapshot().status === 'ready',
      'side_effect_failure_did_not_enter_core_recovery',
      assertions,
    );

    const beforeCoreFailure = await fingerprint(recoveredApplication);
    const rollback = await recoveredApplication.transaction.execute(async (scope) => {
      await recoveredApplication.transaction
        .executorFor(scope)
        .run('UPDATE pet_profiles SET coin_balance = 1 WHERE id = 1', []);
      return { ok: false as const, error: { code: 'INJECTED_CORE_FAILURE' } };
    });
    recoveredApplication.criticalRecovery.enterRecovery('DATABASE_WRITE_FAILED');
    const afterCoreFailure = await fingerprint(recoveredApplication);
    await recoveredApplication.retryRecovery();
    const finalCounts = await readSafetyCounts(recoveredApplication);
    assertProbe(
      !rollback.ok &&
        beforeCoreFailure === afterCoreFailure &&
        finalCounts?.sessionCount === 1 &&
        finalCounts.rewardCount === 0 &&
        finalCounts.totalXp === 0 &&
        finalCounts.coinBalance === 0 &&
        finalCounts.catalogCount === 12,
      'no_reset_repair_terminal_or_reward_path_was_invoked',
      assertions,
    );

    const readyRetry = recoveredApplication.retryRecovery();
    const firstDispose = recoveredApplication.dispose();
    const secondDispose = recoveredApplication.dispose();
    await Promise.all([readyRetry, firstDispose, secondDispose]);
    assertProbe(
      firstDispose === secondDispose &&
        recoveredApplication.bootstrap.getSnapshot().status === 'disposed',
      'repeated_retry_and_dispose_were_safe',
      assertions,
    );
  } catch (error) {
    failedAssertion =
      error instanceof Error ? error.message : 'unknown_failure_recovery_failure';
  } finally {
    const applicationsClosed = await disposeSafely(applications);
    if (!applicationsClosed) {
      failedAssertion ??= 'probe_database_not_closed';
    } else {
      try {
        await driver.deleteDatabase(PROBE_DATABASE);
        if (failedAssertion === undefined) {
          assertions.push('probe_connections_closed_and_database_cleaned');
        }
      } catch {
        failedAssertion ??= 'probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-07_FAILURE_RECOVERY',
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
    sqliteVersion,
    assertions,
  };
};
