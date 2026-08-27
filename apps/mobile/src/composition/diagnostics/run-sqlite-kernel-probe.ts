import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { SQLiteDriver } from '@/infrastructure/database/sqlite-driver';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

const PROBE_DATABASE_NAME = 'pixeldoro-us-02-01-probe.db';
const SQL_SHAPED_VALUE = `Robert'); DROP TABLE probe_child;--`;

export interface SQLiteKernelProbeReport {
  readonly probe: 'US-02-01_SQLITE_KERNEL';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly commitSha: string;
  readonly assertions: readonly string[];
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  passedAssertions: string[],
): void => {
  if (!condition) {
    throw new Error(assertion);
  }
  passedAssertions.push(assertion);
};

const isTechnicalError = (
  value: unknown,
  code: string,
): boolean =>
  typeof value === 'object' &&
  value !== null &&
  'kind' in value &&
  value.kind === 'transaction_technical_error' &&
  'code' in value &&
  value.code === code;

export const runSQLiteKernelProbe = async (
  driver: SQLiteDriver,
): Promise<SQLiteKernelProbeReport> => {
  const assertions: string[] = [];
  const owner = new SQLiteDatabaseOwner(PROBE_DATABASE_NAME, driver);
  const transaction = new SQLiteTransaction(owner);
  let failedAssertion: string | undefined;
  let safeToDelete = false;

  try {
    const openResult = await owner.open();
    assertProbe(openResult.ok, 'connection_open_and_foreign_keys_verified', assertions);

    const setupResult = await transaction.execute(async (scope) => {
      const executor = transaction.executorFor(scope);
      await executor.run(
        'CREATE TABLE IF NOT EXISTS probe_parent (id INTEGER PRIMARY KEY)',
        [],
      );
      await executor.run(
        'CREATE TABLE IF NOT EXISTS probe_child (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES probe_parent(id), value TEXT NOT NULL)',
        [],
      );
      await executor.run('DELETE FROM probe_child', []);
      await executor.run('DELETE FROM probe_parent', []);
      return { ok: true as const, value: undefined };
    });
    assertProbe(setupResult.ok, 'probe_schema_committed', assertions);

    const commitResult = await transaction.execute(async (scope) => {
      const executor = transaction.executorFor(scope);
      await executor.run('INSERT INTO probe_parent(id) VALUES (?)', [1]);
      await executor.run(
        'INSERT INTO probe_child(id, parent_id, value) VALUES (?, ?, ?)',
        [1, 1, SQL_SHAPED_VALUE],
      );
      return { ok: true as const, value: 'commit' };
    });
    assertProbe(commitResult.ok, 'successful_work_committed', assertions);

    const firstClose = await owner.close();
    const reopen = await owner.open();
    assertProbe(firstClose.ok && reopen.ok, 'close_reopen_succeeded', assertions);

    const committedRead = await transaction.execute(async (scope) => {
      const row = await transaction
        .executorFor(scope)
        .getFirst<{ value: string }>(
          'SELECT value FROM probe_child WHERE id = ?',
          [1],
        );
      return { ok: true as const, value: row?.value ?? null };
    });
    assertProbe(
      committedRead.ok && committedRead.value === SQL_SHAPED_VALUE,
      'committed_bound_value_survived_reopen',
      assertions,
    );

    const returnedFailure = await transaction.execute(async (scope) => {
      const executor = transaction.executorFor(scope);
      await executor.run('INSERT INTO probe_parent(id) VALUES (?)', [2]);
      await executor.run(
        'INSERT INTO probe_child(id, parent_id, value) VALUES (?, ?, ?)',
        [2, 2, 'returned-failure'],
      );
      return {
        ok: false as const,
        error: { code: 'PROBE_EXPECTED_ROLLBACK' as const },
      };
    });
    assertProbe(
      !returnedFailure.ok &&
        returnedFailure.error.code === 'PROBE_EXPECTED_ROLLBACK',
      'returned_failure_preserved',
      assertions,
    );

    const thrownFailure = await transaction.execute(async (scope) => {
      const executor = transaction.executorFor(scope);
      await executor.run('INSERT INTO probe_parent(id) VALUES (?)', [3]);
      await executor.run(
        'INSERT INTO probe_child(id, parent_id, value) VALUES (?, ?, ?)',
        [3, 3, 'thrown-failure'],
      );
      throw new Error('probe work failure');
    });
    assertProbe(
      !thrownFailure.ok &&
        isTechnicalError(thrownFailure.error, 'TRANSACTION_WORK_FAILED'),
      'thrown_failure_mapped',
      assertions,
    );

    const rollbackRead = await transaction.execute(async (scope) => {
      const row = await transaction
        .executorFor(scope)
        .getFirst<{ count: number }>(
          'SELECT COUNT(*) AS count FROM probe_child WHERE id IN (?, ?)',
          [2, 3],
        );
      return { ok: true as const, value: row?.count ?? -1 };
    });
    assertProbe(
      rollbackRead.ok && rollbackRead.value === 0,
      'returned_and_thrown_work_rolled_back',
      assertions,
    );

    const foreignKeyFailure = await transaction.execute(async (scope) => {
      await transaction
        .executorFor(scope)
        .run(
          'INSERT INTO probe_child(id, parent_id, value) VALUES (?, ?, ?)',
          [4, 999, 'invalid-parent'],
        );
      return { ok: true as const, value: 'must-not-commit' };
    });
    assertProbe(
      !foreignKeyFailure.ok &&
        isTechnicalError(foreignKeyFailure.error, 'TRANSACTION_WORK_FAILED'),
      'foreign_key_violation_rejected',
      assertions,
    );

    let releaseFirst: () => void = () => undefined;
    let markFirstEntered: () => void = () => undefined;
    const firstEntered = new Promise<void>((resolve) => {
      markFirstEntered = resolve;
    });
    const releaseGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstTransaction = transaction.execute(async () => {
      markFirstEntered();
      await releaseGate;
      return { ok: true as const, value: 'first' };
    });
    await firstEntered;
    const overlap = await transaction.execute(async () => ({
      ok: true as const,
      value: 'must-not-run',
    }));
    releaseFirst();
    const firstTransactionResult = await firstTransaction;
    assertProbe(
      firstTransactionResult.ok &&
        !overlap.ok &&
        isTechnicalError(overlap.error, 'TRANSACTION_BUSY'),
      'overlap_rejected_deterministically',
      assertions,
    );

    const closeResult = await owner.close();
    const repeatedCloseResult = await owner.close();
    assertProbe(
      closeResult.ok && repeatedCloseResult.ok,
      'dispose_is_idempotent',
      assertions,
    );
    safeToDelete = true;
  } catch (error) {
    failedAssertion =
      error instanceof Error ? error.message : 'unknown_probe_failure';
  } finally {
    const closeResult = await owner.close();
    safeToDelete = safeToDelete || closeResult.ok;

    if (safeToDelete) {
      try {
        await driver.deleteDatabase(PROBE_DATABASE_NAME);
      } catch {
        failedAssertion ??= 'probe_database_cleanup_failed';
      }
    } else {
      failedAssertion ??= 'probe_database_not_closed';
    }
  }

  return {
    probe: 'US-02-01_SQLITE_KERNEL',
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
    assertions,
  };
};
