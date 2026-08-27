import type {
  SQLiteBindParams,
  SQLiteDatabase,
  SQLiteRunResult,
} from 'expo-sqlite';

export type SQLiteConnection = Pick<
  SQLiteDatabase,
  'closeAsync' | 'execAsync' | 'getAllAsync' | 'getFirstAsync' | 'runAsync'
>;

export type SQLiteParameters = SQLiteBindParams;
export type SQLiteWriteResult = SQLiteRunResult;

export interface SQLiteDriver {
  openDatabase(databaseName: string): Promise<SQLiteConnection>;
  deleteDatabase(databaseName: string): Promise<void>;
}

export class ExpoSQLiteDriver implements SQLiteDriver {
  async openDatabase(databaseName: string): Promise<SQLiteConnection> {
    const { openDatabaseAsync } = await import('expo-sqlite');
    return openDatabaseAsync(databaseName);
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    const { deleteDatabaseAsync } = await import('expo-sqlite');
    await deleteDatabaseAsync(databaseName);
  }
}
