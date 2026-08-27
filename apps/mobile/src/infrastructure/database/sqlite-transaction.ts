import {
  transactionTechnicalError,
  type ApplicationResult,
  type TransactionPort,
  type TransactionScope,
  type TransactionTechnicalError,
} from '@pixeldoro/application';

import {
  SQLiteConnectionUnavailableError,
  type SQLiteDatabaseOwner,
} from './sqlite-database-owner';
import type { SQLiteConnection } from './sqlite-driver';
import { SQLiteExecutor } from './sqlite-executor';

const BEGIN_IMMEDIATE = 'BEGIN IMMEDIATE';
const COMMIT = 'COMMIT';
const ROLLBACK = 'ROLLBACK';

interface ActiveTransaction {
  readonly scope: TransactionScope;
  readonly executor: SQLiteExecutor;
}

export class InvalidSQLiteTransactionScopeError extends Error {
  constructor() {
    super('Transaction scope is no longer active');
    this.name = 'InvalidSQLiteTransactionScopeError';
  }
}

export class SQLiteTransaction implements TransactionPort {
  private activeTransaction: ActiveTransaction | undefined;
  private executing = false;

  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  async execute<TValue, TError>(
    work: (
      scope: TransactionScope,
    ) => Promise<ApplicationResult<TValue, TError>>,
  ): Promise<ApplicationResult<TValue, TError | TransactionTechnicalError>> {
    if (this.executing) {
      return {
        ok: false,
        error: transactionTechnicalError('TRANSACTION_BUSY'),
      };
    }

    this.executing = true;

    try {
      return await this.owner.withConnection((connection) =>
        this.executeWithConnection(connection, work),
      );
    } catch (error) {
      return {
        ok: false,
        error: transactionTechnicalError(
          error instanceof SQLiteConnectionUnavailableError
            ? 'DATABASE_NOT_OPEN'
            : 'TRANSACTION_BEGIN_FAILED',
        ),
      };
    } finally {
      this.executing = false;
    }
  }

  executorFor(scope: TransactionScope): SQLiteExecutor {
    if (
      this.activeTransaction === undefined ||
      this.activeTransaction.scope.transactionId !== scope.transactionId
    ) {
      throw new InvalidSQLiteTransactionScopeError();
    }

    return this.activeTransaction.executor;
  }

  private async executeWithConnection<TValue, TError>(
    connection: SQLiteConnection,
    work: (
      scope: TransactionScope,
    ) => Promise<ApplicationResult<TValue, TError>>,
  ): Promise<ApplicationResult<TValue, TError | TransactionTechnicalError>> {
    try {
      await connection.execAsync(BEGIN_IMMEDIATE);
    } catch {
      return {
        ok: false,
        error: transactionTechnicalError('TRANSACTION_BEGIN_FAILED'),
      };
    }

    const scope: TransactionScope = {
      transactionId: Symbol('sqlite-transaction'),
    };
    this.activeTransaction = {
      scope,
      executor: new SQLiteExecutor(connection),
    };

    try {
      let result: ApplicationResult<TValue, TError>;

      try {
        result = await work(scope);
      } catch {
        const rollbackError = await this.rollback(connection);
        return {
          ok: false,
          error:
            rollbackError ??
            transactionTechnicalError('TRANSACTION_WORK_FAILED'),
        };
      }

      if (!result.ok) {
        const rollbackError = await this.rollback(connection);
        return rollbackError === undefined
          ? result
          : { ok: false, error: rollbackError };
      }

      try {
        await connection.execAsync(COMMIT);
        return result;
      } catch {
        const rollbackError = await this.rollback(connection);
        return {
          ok: false,
          error:
            rollbackError ??
            transactionTechnicalError('TRANSACTION_COMMIT_FAILED'),
        };
      }
    } finally {
      this.activeTransaction = undefined;
    }
  }

  private async rollback(
    connection: SQLiteConnection,
  ): Promise<TransactionTechnicalError | undefined> {
    try {
      await connection.execAsync(ROLLBACK);
      return undefined;
    } catch {
      return transactionTechnicalError('TRANSACTION_ROLLBACK_FAILED');
    }
  }
}
