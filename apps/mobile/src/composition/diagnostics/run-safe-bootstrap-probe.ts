import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { StartupReconciliationPort } from '@/application';
import { INITIAL_SCHEMA_TABLES } from '@/infrastructure/database/migrations/schema-manifest';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type { SQLiteDriver } from '@/infrastructure/database/sqlite-driver';
import { SQLiteExecutor } from '@/infrastructure/database/sqlite-executor';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

import { createMobileApplication } from '../create-mobile-application';
import type { MobileApplication } from '../mobile-application';

const PROBE_DATABASE = 'pixeldoro-us-02-04-safe-bootstrap-probe.db';

interface CountRow {
  readonly migration_count: number;
  readonly installation_count: number;
  readonly settings_count: number;
  readonly profile_count: number;
  readonly catalog_count: number;
}

export interface SafeBootstrapProbeReport {
  readonly probe: 'US-02-04_SAFE_BOOTSTRAP';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly assertions: readonly string[];
}

class CountingReconciliation implements StartupReconciliationPort {
  calls = 0;
  onCall: (() => void) | undefined;

  async reconcileAtStartup(): ReturnType<
    StartupReconciliationPort['reconcileAtStartup']
  > {
    this.calls += 1;
    this.onCall?.();
    return { ok: true, value: { durableDataChanged: false } };
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

const readWithTransaction = async <TValue>(
  transaction: SQLiteTransaction,
  work: (executor: SQLiteExecutor) => Promise<TValue>,
): Promise<TValue> => {
  const result = await transaction.execute(async (scope) => ({
    ok: true as const,
    value: await work(transaction.executorFor(scope)),
  }));
  if (!result.ok) throw new Error('safe_bootstrap_probe_read_failed');
  return result.value;
};

const readCounts = (transaction: SQLiteTransaction): Promise<CountRow | null> =>
  readWithTransaction(transaction, (executor) =>
    executor.getFirst<CountRow>(
      `SELECT
        (SELECT COUNT(*) FROM schema_migrations) AS migration_count,
        (SELECT COUNT(*) FROM app_installation) AS installation_count,
        (SELECT COUNT(*) FROM app_settings) AS settings_count,
        (SELECT COUNT(*) FROM pet_profiles) AS profile_count,
        (SELECT COUNT(*) FROM catalog_items) AS catalog_count`,
      [],
    ),
  );

const fingerprint = async (transaction: SQLiteTransaction): Promise<string> =>
  readWithTransaction(transaction, async (executor) => {
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

const disposeSafely = async (
  applications: readonly MobileApplication[],
): Promise<boolean> => {
  const results = await Promise.allSettled(
    applications.map((application) => application.dispose()),
  );
  return results.every((result) => result.status === 'fulfilled');
};

export const runSafeBootstrapProbe = async (
  driver: SQLiteDriver,
): Promise<SafeBootstrapProbeReport> => {
  const assertions: string[] = [];
  const applications: MobileApplication[] = [];
  const mutationOwner = new SQLiteDatabaseOwner(PROBE_DATABASE, driver);
  let failedAssertion: string | undefined;

  try {
    await removeStaleDatabase(driver);

    const firstReconciliation = new CountingReconciliation();
    const first = createMobileApplication({
      databaseName: PROBE_DATABASE,
      diagnosticsEnabled: false,
      sqliteDriver: driver,
      startupReconciliation: firstReconciliation,
    });
    applications.push(first);
    const phaseTrace: string[] = [];
    first.bootstrap.subscribe(() => {
      const projection = first.bootstrap.getSnapshot();
      if (projection.status === 'booting') phaseTrace.push(projection.phase);
      if (projection.status === 'ready') phaseTrace.push('ready');
    });
    let gateWasClosedDuringReconciliation = false;
    firstReconciliation.onCall = () => {
      gateWasClosedDuringReconciliation = !first.readiness.run(() => 'unsafe').ok;
    };
    await first.boot();
    const firstProjection = first.bootstrap.getSnapshot();
    assertProbe(
      firstProjection.status === 'ready' &&
        firstReconciliation.calls === 1 &&
        phaseTrace.join(',') ===
          'opening,migrating,verifying,hydrating,reconciling,ready',
      'empty_database_reached_ready_after_ordered_barrier',
      assertions,
    );
    if (firstProjection.status !== 'ready') {
      throw new Error('safe_bootstrap_first_snapshot_unavailable');
    }
    const firstSnapshot = JSON.stringify(firstProjection.snapshot);
    assertProbe(
      firstProjection.snapshot.migrationVersion === 1 &&
        firstProjection.snapshot.catalog.length === 12 &&
        firstProjection.snapshot.profile.totalXp === 0 &&
        firstProjection.snapshot.profile.coinBalance === 0,
      'exact_durable_snapshot_hydrated',
      assertions,
    );
    assertProbe(
      gateWasClosedDuringReconciliation &&
        first.readiness.run(() => 'ready').ok &&
        firstReconciliation.calls === 1,
      'readiness_gate_opened_only_after_reconciliation',
      assertions,
    );
    const firstCounts = await readCounts(first.transaction);
    await first.dispose();

    const reopened = createMobileApplication({
      databaseName: PROBE_DATABASE,
      diagnosticsEnabled: false,
      sqliteDriver: driver,
    });
    applications.push(reopened);
    await reopened.boot();
    const reopenedProjection = reopened.bootstrap.getSnapshot();
    const reopenedCounts = await readCounts(reopened.transaction);
    assertProbe(
      reopenedProjection.status === 'ready' &&
        JSON.stringify(reopenedProjection.snapshot) === firstSnapshot &&
        JSON.stringify(reopenedCounts) === JSON.stringify(firstCounts) &&
        reopenedCounts !== null &&
        reopenedCounts.migration_count === 1 &&
        reopenedCounts.catalog_count === 12,
      'latest_reopen_preserved_snapshot_without_duplicate_seed',
      assertions,
    );
    await reopened.dispose();

    const mutationOpen = await mutationOwner.open();
    if (!mutationOpen.ok) throw new Error('safe_bootstrap_mutation_open_failed');
    const mutationTransaction = new SQLiteTransaction(mutationOwner);
    const mutationResult = await mutationTransaction.execute(async (scope) => {
      await mutationTransaction
        .executorFor(scope)
        .run('UPDATE pet_profiles SET coin_balance = ? WHERE id = ?', [1, 1]);
      return { ok: true as const, value: undefined };
    });
    if (!mutationResult.ok) throw new Error('safe_bootstrap_mutation_failed');
    const beforeFailure = await fingerprint(mutationTransaction);
    const mutationClose = await mutationOwner.close();
    if (!mutationClose.ok) throw new Error('safe_bootstrap_mutation_close_failed');

    const failedReconciliation = new CountingReconciliation();
    const failed = createMobileApplication({
      databaseName: PROBE_DATABASE,
      diagnosticsEnabled: false,
      sqliteDriver: driver,
      startupReconciliation: failedReconciliation,
    });
    applications.push(failed);
    await failed.boot();
    const failedProjection = failed.bootstrap.getSnapshot();
    assertProbe(
      failedProjection.status === 'recovery' &&
        failedProjection.phase === 'verifying' &&
        failedProjection.error.code ===
          'BOOTSTRAP_ECONOMY_INVARIANT_FAILED',
      'injected_invariant_mismatch_entered_typed_recovery',
      assertions,
    );
    assertProbe(
      !failed.readiness.run(() => 'forbidden').ok &&
        failedReconciliation.calls === 0,
      'failed_bootstrap_kept_gate_closed_and_skipped_reconciliation',
      assertions,
    );
    const afterFailure = await fingerprint(failed.transaction);
    assertProbe(
      afterFailure === beforeFailure,
      'failed_bootstrap_preserved_database_fingerprint',
      assertions,
    );
    await failed.boot();
    const firstDispose = failed.dispose();
    const secondDispose = failed.dispose();
    await Promise.all([firstDispose, secondDispose]);
    assertProbe(
      firstDispose === secondDispose &&
        failed.bootstrap.getSnapshot().status === 'disposed',
      'repeated_boot_and_dispose_were_idempotent',
      assertions,
    );
  } catch (error) {
    failedAssertion =
      error instanceof Error ? error.message : 'unknown_safe_bootstrap_failure';
  } finally {
    const applicationsClosed = await disposeSafely(applications);
    const mutationClosed = await mutationOwner.close();
    if (!applicationsClosed || !mutationClosed.ok) {
      failedAssertion ??= 'probe_database_not_closed';
    } else {
      try {
        await driver.deleteDatabase(PROBE_DATABASE);
        if (failedAssertion === undefined) {
          assertions.push('probe_connections_closed_and_databases_cleaned');
        }
      } catch {
        failedAssertion ??= 'probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-04_SAFE_BOOTSTRAP',
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
