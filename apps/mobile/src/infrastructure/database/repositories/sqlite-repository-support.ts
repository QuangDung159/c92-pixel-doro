import {
  persistenceError,
  type PersistenceResult,
  type TransactionScope,
} from '@pixeldoro/application';

import {
  SQLiteConnectionUnavailableError,
  type SQLiteDatabaseOwner,
} from '../sqlite-database-owner';
import type { SQLiteParameters } from '../sqlite-driver';
import { SQLiteExecutor } from '../sqlite-executor';
import {
  InvalidSQLiteTransactionScopeError,
  type SQLiteTransaction,
} from '../sqlite-transaction';
import type { RowMapping } from '../mappers/row-mapping';

export type RepositoryWork<TValue> = (
  executor: SQLiteExecutor,
) => Promise<PersistenceResult<TValue>>;

export const readWithOwner = async <TValue>(
  owner: SQLiteDatabaseOwner,
  entity: string,
  work: RepositoryWork<TValue>,
): Promise<PersistenceResult<TValue>> => {
  try {
    return await owner.withConnection((connection) =>
      work(new SQLiteExecutor(connection)),
    );
  } catch (error) {
    return {
      ok: false,
      error: persistenceError(
        error instanceof SQLiteConnectionUnavailableError
          ? 'PERSISTENCE_UNAVAILABLE'
          : 'PERSISTENCE_QUERY_FAILED',
        entity,
      ),
    };
  }
};

export const writeWithOwner = async <TValue>(
  owner: SQLiteDatabaseOwner,
  entity: string,
  work: RepositoryWork<TValue>,
): Promise<PersistenceResult<TValue>> => {
  try {
    return await owner.withConnection((connection) =>
      work(new SQLiteExecutor(connection)),
    );
  } catch (error) {
    return {
      ok: false,
      error: mapWriteError(error, entity),
    };
  }
};

export const withTransactionExecutor = async <TValue>(
  transaction: SQLiteTransaction,
  scope: TransactionScope,
  entity: string,
  work: RepositoryWork<TValue>,
): Promise<PersistenceResult<TValue>> => {
  try {
    return await work(transaction.executorFor(scope));
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof InvalidSQLiteTransactionScopeError
          ? persistenceError('PERSISTENCE_UNAVAILABLE', entity)
          : mapWriteError(error, entity),
    };
  }
};

export const readMappedOne = async <TRow, TValue>(
  executor: SQLiteExecutor,
  entity: string,
  sql: string,
  parameters: SQLiteParameters,
  mapper: (row: TRow) => RowMapping<TValue>,
): Promise<PersistenceResult<TValue | null>> => {
  try {
    const row = await executor.getFirst<TRow>(sql, parameters);
    if (row === null) return { ok: true, value: null };
    const result = mapper(row);
    return result.ok
      ? { ok: true, value: result.value }
      : {
          ok: false,
          error: persistenceError(
            'PERSISTENCE_CORRUPT_DATA',
            entity,
            result.field,
          ),
        };
  } catch {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_QUERY_FAILED', entity),
    };
  }
};

export const readMappedAll = async <TRow, TValue>(
  executor: SQLiteExecutor,
  entity: string,
  sql: string,
  parameters: SQLiteParameters,
  mapper: (row: TRow) => RowMapping<TValue>,
): Promise<PersistenceResult<readonly TValue[]>> => {
  try {
    const rows = await executor.getAll<TRow>(sql, parameters);
    const values: TValue[] = [];
    for (const row of rows) {
      const result = mapper(row);
      if (!result.ok) {
        return {
          ok: false,
          error: persistenceError(
            'PERSISTENCE_CORRUPT_DATA',
            entity,
            result.field,
          ),
        };
      }
      values.push(result.value);
    }
    return { ok: true, value: Object.freeze(values) };
  } catch {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_QUERY_FAILED', entity),
    };
  }
};

export const mapWriteError = (
  error: unknown,
  entity: string,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const isConflict = /constraint|unique|foreign key|immutable|mismatch/i.test(message);
  return persistenceError(
    isConflict ? 'PERSISTENCE_CONFLICT' : 'PERSISTENCE_WRITE_FAILED',
    entity,
  );
};
