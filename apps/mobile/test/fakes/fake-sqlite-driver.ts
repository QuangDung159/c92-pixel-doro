import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
} from '@/infrastructure/database/sqlite-driver';

export class FakeSQLiteConnection {
  readonly controlStatements: string[] = [];
  readonly boundStatements: {
    readonly sql: string;
    readonly parameters: SQLiteParameters;
  }[] = [];
  foreignKeys = 1;
  closeCalls = 0;
  closeError: unknown;
  readonly execErrors = new Map<string, unknown>();
  readonly runErrors = new Map<string, unknown>();
  readonly firstErrors = new Map<string, unknown>();
  readonly allErrors = new Map<string, unknown>();
  readonly firstRows = new Map<string, unknown>();
  readonly allRows = new Map<string, unknown[]>();

  async closeAsync(): Promise<void> {
    this.closeCalls += 1;
    if (this.closeError !== undefined) {
      throw this.closeError;
    }
  }

  async execAsync(sql: string): Promise<void> {
    this.controlStatements.push(sql);
    const error = this.execErrors.get(sql);
    if (error !== undefined) {
      throw error;
    }
  }

  async runAsync(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    this.boundStatements.push({ sql, parameters });
    const error = this.runErrors.get(sql);
    if (error !== undefined) {
      throw error;
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getFirstAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    this.boundStatements.push({ sql, parameters });

    const error = this.firstErrors.get(sql);
    if (error !== undefined) {
      throw error;
    }

    if (sql === 'PRAGMA foreign_keys') {
      return { foreign_keys: this.foreignKeys } as TRow;
    }

    return (this.firstRows.get(sql) as TRow | undefined) ?? null;
  }

  async getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    this.boundStatements.push({ sql, parameters });
    const error = this.allErrors.get(sql);
    if (error !== undefined) {
      throw error;
    }
    return (this.allRows.get(sql) as TRow[] | undefined) ?? [];
  }

  asConnection(): SQLiteConnection {
    return this as unknown as SQLiteConnection;
  }
}

export class FakeSQLiteDriver implements SQLiteDriver {
  openCalls = 0;
  deleteCalls: string[] = [];
  openError: unknown;
  openGate: Promise<void> | undefined;

  constructor(readonly connection = new FakeSQLiteConnection()) {}

  async openDatabase(): Promise<SQLiteConnection> {
    this.openCalls += 1;
    await this.openGate;
    if (this.openError !== undefined) {
      throw this.openError;
    }
    return this.connection.asConnection();
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    this.deleteCalls.push(databaseName);
  }
}
