import { describe, expect, it } from 'vitest';

import { FakeSQLiteDriver } from '../../../test/fakes/fake-sqlite-driver';
import { SQLiteDatabaseOwner } from './sqlite-database-owner';
import {
  InvalidSQLiteTransactionScopeError,
  SQLiteTransaction,
} from './sqlite-transaction';

const createKernel = async () => {
  const driver = new FakeSQLiteDriver();
  const owner = new SQLiteDatabaseOwner('pixeldoro.db', driver);
  const transaction = new SQLiteTransaction(owner);
  await owner.open();
  driver.connection.controlStatements.length = 0;
  driver.connection.boundStatements.length = 0;
  return { driver, owner, transaction };
};

const createDeferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe('SQLiteTransaction', () => {
  it('commits successful bound writes on the owner connection', async () => {
    const { driver, transaction } = await createKernel();
    const input = `Robert'); DROP TABLE probe;--`;

    const result = await transaction.execute(async (scope) => {
      await transaction
        .executorFor(scope)
        .run('INSERT INTO probe(value) VALUES (?)', [input]);
      return { ok: true as const, value: 'committed' };
    });

    expect(result).toEqual({ ok: true, value: 'committed' });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'COMMIT',
    ]);
    expect(driver.connection.boundStatements).toEqual([
      {
        sql: 'INSERT INTO probe(value) VALUES (?)',
        parameters: [input],
      },
    ]);
  });

  it('rolls back and preserves a returned application failure', async () => {
    const { driver, transaction } = await createKernel();
    const expectedError = { code: 'EXPECTED_FAILURE' as const };

    const result = await transaction.execute(async () => ({
      ok: false as const,
      error: expectedError,
    }));

    expect(result).toEqual({ ok: false, error: expectedError });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'ROLLBACK',
    ]);
  });

  it('rolls back and maps thrown work without leaking the exception', async () => {
    const { driver, transaction } = await createKernel();

    const result = await transaction.execute(async () => {
      throw new Error('raw provider detail');
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'ROLLBACK',
    ]);
  });

  it('rejects overlap without queueing or auto-committing', async () => {
    const { transaction } = await createKernel();
    const entered = createDeferred();
    const release = createDeferred();

    const first = transaction.execute(async () => {
      entered.resolve();
      await release.promise;
      return { ok: true as const, value: 'first' };
    });
    await entered.promise;

    await expect(
      transaction.execute(async () => ({ ok: true as const, value: 'second' })),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_BUSY',
      },
    });

    release.resolve();
    await expect(first).resolves.toEqual({ ok: true, value: 'first' });
  });

  it('invalidates transaction scope after commit', async () => {
    const { transaction } = await createKernel();
    let capturedScope: Parameters<typeof transaction.executorFor>[0] | undefined;

    await transaction.execute(async (scope) => {
      capturedScope = scope;
      return { ok: true as const, value: undefined };
    });

    expect(capturedScope).toBeDefined();
    expect(() => transaction.executorFor(capturedScope!)).toThrow(
      InvalidSQLiteTransactionScopeError,
    );
  });

  it('maps commit failure and rolls back', async () => {
    const { driver, transaction } = await createKernel();
    driver.connection.execErrors.set('COMMIT', new Error('commit provider detail'));

    await expect(
      transaction.execute(async () => ({ ok: true as const, value: 'unsafe' })),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_COMMIT_FAILED',
      },
    });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'COMMIT',
      'ROLLBACK',
    ]);
  });

  it('maps begin failure and does not run work or rollback', async () => {
    const { driver, transaction } = await createKernel();
    driver.connection.execErrors.set(
      'BEGIN IMMEDIATE',
      new Error('begin provider detail'),
    );
    let workCalls = 0;

    await expect(
      transaction.execute(async () => {
        workCalls += 1;
        return { ok: true as const, value: 'unsafe' };
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_BEGIN_FAILED',
      },
    });
    expect(workCalls).toBe(0);
    expect(driver.connection.controlStatements).toEqual(['BEGIN IMMEDIATE']);
  });

  it('prioritizes rollback failure over the work failure', async () => {
    const { driver, transaction } = await createKernel();
    driver.connection.execErrors.set(
      'ROLLBACK',
      new Error('rollback provider detail'),
    );

    await expect(
      transaction.execute(async () => {
        throw new Error('work provider detail');
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_ROLLBACK_FAILED',
      },
    });
  });

  it('returns DATABASE_NOT_OPEN before owner readiness', async () => {
    const driver = new FakeSQLiteDriver();
    const owner = new SQLiteDatabaseOwner('pixeldoro.db', driver);
    const transaction = new SQLiteTransaction(owner);

    await expect(
      transaction.execute(async () => ({ ok: true as const, value: 'unsafe' })),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'DATABASE_NOT_OPEN',
      },
    });
    expect(driver.openCalls).toBe(0);
  });
});
