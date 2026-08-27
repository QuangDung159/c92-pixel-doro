import {
  databaseLifecycleError,
  type DatabaseLifecycleError,
  type DatabaseLifecyclePort,
} from '@/application';
import type { ApplicationResult } from '@pixeldoro/application';

import type { SQLiteConnection, SQLiteDriver } from './sqlite-driver';

type SQLiteOwnerState =
  | 'closed'
  | 'opening'
  | 'open'
  | 'closing'
  | 'close_failed';

const successfulLifecycleResult = (): ApplicationResult<void, never> => ({
  ok: true,
  value: undefined,
});

export class SQLiteConnectionUnavailableError extends Error {
  constructor() {
    super('SQLite connection is not open');
    this.name = 'SQLiteConnectionUnavailableError';
  }
}

export class SQLiteDatabaseOwner implements DatabaseLifecyclePort {
  private state: SQLiteOwnerState = 'closed';
  private connection: SQLiteConnection | undefined;
  private openPromise:
    | Promise<ApplicationResult<void, DatabaseLifecycleError>>
    | undefined;
  private closePromise:
    | Promise<ApplicationResult<void, DatabaseLifecycleError>>
    | undefined;
  private closeFailure: DatabaseLifecycleError | undefined;
  private activeLeases = 0;
  private readonly idleWaiters = new Set<() => void>();

  constructor(
    readonly databaseName: string,
    private readonly driver: SQLiteDriver,
  ) {}

  async open(): Promise<ApplicationResult<void, DatabaseLifecycleError>> {
    if (this.state === 'open') {
      return successfulLifecycleResult();
    }

    if (this.state === 'opening' && this.openPromise !== undefined) {
      return this.openPromise;
    }

    if (this.state === 'closing' && this.closePromise !== undefined) {
      const closeResult = await this.closePromise;
      if (!closeResult.ok) {
        return {
          ok: false,
          error: databaseLifecycleError('DATABASE_OPEN_FAILED'),
        };
      }
      return this.open();
    }

    if (this.state === 'close_failed') {
      return {
        ok: false,
        error: databaseLifecycleError('DATABASE_OPEN_FAILED'),
      };
    }

    const operation = this.openConnection();
    this.openPromise = operation;
    const result = await operation;

    if (this.openPromise === operation) {
      this.openPromise = undefined;
    }

    return result;
  }

  async close(): Promise<ApplicationResult<void, DatabaseLifecycleError>> {
    if (this.state === 'opening' && this.openPromise !== undefined) {
      await this.openPromise;
    }

    if (this.state === 'closed') {
      return successfulLifecycleResult();
    }

    if (this.state === 'closing' && this.closePromise !== undefined) {
      return this.closePromise;
    }

    if (this.state === 'close_failed') {
      return {
        ok: false,
        error:
          this.closeFailure ??
          databaseLifecycleError('DATABASE_CLOSE_FAILED'),
      };
    }

    const operation = this.closeConnection();
    this.closePromise = operation;
    const result = await operation;

    if (this.closePromise === operation) {
      this.closePromise = undefined;
    }

    return result;
  }

  async withConnection<TValue>(
    work: (connection: SQLiteConnection) => Promise<TValue>,
  ): Promise<TValue> {
    if (this.state !== 'open' || this.connection === undefined) {
      throw new SQLiteConnectionUnavailableError();
    }

    const connection = this.connection;
    this.activeLeases += 1;

    try {
      return await work(connection);
    } finally {
      this.activeLeases -= 1;
      if (this.activeLeases === 0) {
        this.idleWaiters.forEach((resolve) => resolve());
        this.idleWaiters.clear();
      }
    }
  }

  private async openConnection(): Promise<
    ApplicationResult<void, DatabaseLifecycleError>
  > {
    this.state = 'opening';
    let connection: SQLiteConnection | undefined;

    try {
      connection = await this.driver.openDatabase(this.databaseName);
      await connection.execAsync('PRAGMA foreign_keys = ON');
      const row = await connection.getFirstAsync<{ foreign_keys: number }>(
        'PRAGMA foreign_keys',
        [],
      );

      if (row?.foreign_keys !== 1) {
        throw new Error('Foreign key enforcement is unavailable');
      }

      this.connection = connection;
      this.state = 'open';
      return successfulLifecycleResult();
    } catch {
      if (connection !== undefined) {
        try {
          await connection.closeAsync();
        } catch {
          this.connection = connection;
          this.state = 'close_failed';
          this.closeFailure = databaseLifecycleError('DATABASE_CLOSE_FAILED');
          return {
            ok: false,
            error: databaseLifecycleError('DATABASE_OPEN_FAILED'),
          };
        }
      }

      this.connection = undefined;
      this.state = 'closed';
      return {
        ok: false,
        error: databaseLifecycleError('DATABASE_OPEN_FAILED'),
      };
    }
  }

  private async closeConnection(): Promise<
    ApplicationResult<void, DatabaseLifecycleError>
  > {
    this.state = 'closing';
    await this.waitUntilIdle();

    const connection = this.connection;
    if (connection === undefined) {
      this.state = 'closed';
      return successfulLifecycleResult();
    }

    try {
      await connection.closeAsync();
      this.connection = undefined;
      this.closeFailure = undefined;
      this.state = 'closed';
      return successfulLifecycleResult();
    } catch {
      const error = databaseLifecycleError('DATABASE_CLOSE_FAILED');
      this.closeFailure = error;
      this.state = 'close_failed';
      return { ok: false, error };
    }
  }

  private waitUntilIdle(): Promise<void> {
    if (this.activeLeases === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.idleWaiters.add(resolve);
    });
  }
}
