import { describe, expect, it } from 'vitest';

import {
  FakeSQLiteConnection,
  FakeSQLiteDriver,
} from '../../../test/fakes/fake-sqlite-driver';
import { SQLiteDatabaseOwner } from './sqlite-database-owner';

const createDeferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe('SQLiteDatabaseOwner', () => {
  it('opens once, enables foreign keys, verifies them, and closes once', async () => {
    const driver = new FakeSQLiteDriver();
    const owner = new SQLiteDatabaseOwner('pixeldoro.db', driver);

    await expect(Promise.all([owner.open(), owner.open()])).resolves.toEqual([
      { ok: true, value: undefined },
      { ok: true, value: undefined },
    ]);
    expect(driver.openCalls).toBe(1);
    expect(driver.connection.controlStatements).toEqual([
      'PRAGMA foreign_keys = ON',
    ]);
    expect(driver.connection.boundStatements[0]).toEqual({
      sql: 'PRAGMA foreign_keys',
      parameters: [],
    });

    await expect(Promise.all([owner.close(), owner.close()])).resolves.toEqual([
      { ok: true, value: undefined },
      { ok: true, value: undefined },
    ]);
    expect(driver.connection.closeCalls).toBe(1);
  });

  it('does not publish a connection when foreign keys cannot be enabled', async () => {
    const connection = new FakeSQLiteConnection();
    connection.foreignKeys = 0;
    const owner = new SQLiteDatabaseOwner(
      'pixeldoro.db',
      new FakeSQLiteDriver(connection),
    );

    await expect(owner.open()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'database_lifecycle_error',
        code: 'DATABASE_OPEN_FAILED',
      },
    });
    expect(connection.closeCalls).toBe(1);
    await expect(
      owner.withConnection(async () => 'must-not-run'),
    ).rejects.toThrow('SQLite connection is not open');
  });

  it('maps native open failure without exposing the provider detail', async () => {
    const driver = new FakeSQLiteDriver();
    driver.openError = new Error('native provider detail');
    const owner = new SQLiteDatabaseOwner('pixeldoro.db', driver);

    await expect(owner.open()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'database_lifecycle_error',
        code: 'DATABASE_OPEN_FAILED',
      },
    });
    await expect(owner.close()).resolves.toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('waits for an active connection lease before closing', async () => {
    const driver = new FakeSQLiteDriver();
    const owner = new SQLiteDatabaseOwner('pixeldoro.db', driver);
    const gate = createDeferred();
    await owner.open();

    const work = owner.withConnection(async () => {
      await gate.promise;
      return 'finished';
    });
    const close = owner.close();
    await Promise.resolve();

    expect(driver.connection.closeCalls).toBe(0);
    gate.resolve();
    await expect(work).resolves.toBe('finished');
    await expect(close).resolves.toEqual({ ok: true, value: undefined });
    expect(driver.connection.closeCalls).toBe(1);
  });

  it('keeps a stable close failure and does not call native close again', async () => {
    const connection = new FakeSQLiteConnection();
    connection.closeError = new Error('native provider detail');
    const owner = new SQLiteDatabaseOwner(
      'pixeldoro.db',
      new FakeSQLiteDriver(connection),
    );
    await owner.open();

    const expected = {
      ok: false as const,
      error: {
        kind: 'database_lifecycle_error' as const,
        code: 'DATABASE_CLOSE_FAILED' as const,
      },
    };
    await expect(owner.close()).resolves.toEqual(expected);
    await expect(owner.close()).resolves.toEqual(expected);
    expect(connection.closeCalls).toBe(1);
  });
});
