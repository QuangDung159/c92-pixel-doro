import { describe, expect, it } from 'vitest';

import { FakeTransaction } from '../../test/fakes/fake-transaction';

describe('TransactionPort fake contract', () => {
  it('commits only a successful application result', async () => {
    const transaction = new FakeTransaction();

    const result = await transaction.execute(async () => ({
      ok: true as const,
      value: 'committed',
    }));

    expect(result).toEqual({ ok: true, value: 'committed' });
    expect(transaction.commits).toBe(1);
    expect(transaction.rollbacks).toBe(0);
  });

  it('rolls back and preserves an expected application failure', async () => {
    const transaction = new FakeTransaction();
    const expectedError = { code: 'EXPECTED_FAILURE' as const };

    const result = await transaction.execute(async () => ({
      ok: false as const,
      error: expectedError,
    }));

    expect(result).toEqual({ ok: false, error: expectedError });
    expect(transaction.commits).toBe(0);
    expect(transaction.rollbacks).toBe(1);
  });

  it('rolls back and maps a thrown failure without leaking the exception', async () => {
    const transaction = new FakeTransaction();

    const result = await transaction.execute(async () => {
      throw new Error('provider detail');
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(transaction.rollbacks).toBe(1);
  });

  it('rejects a nested transaction deterministically', async () => {
    const transaction = new FakeTransaction();

    const result = await transaction.execute(async () => {
      const nested = await transaction.execute(async () => ({
        ok: true as const,
        value: 'must-not-commit',
      }));

      expect(nested).toEqual({
        ok: false,
        error: {
          kind: 'transaction_technical_error',
          code: 'TRANSACTION_BUSY',
        },
      });

      return { ok: true as const, value: 'outer-commit' };
    });

    expect(result).toEqual({ ok: true, value: 'outer-commit' });
    expect(transaction.commits).toBe(1);
  });
});
