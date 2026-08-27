import type {
  SQLiteConnection,
  SQLiteParameters,
  SQLiteWriteResult,
} from './sqlite-driver';

export class SQLiteExecutor {
  constructor(private readonly connection: SQLiteConnection) {}

  run(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> {
    return this.connection.runAsync(sql, parameters);
  }

  getFirst<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    return this.connection.getFirstAsync<TRow>(sql, parameters);
  }

  getAll<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    return this.connection.getAllAsync<TRow>(sql, parameters);
  }
}
