import { describe, expect, it } from 'vitest';

import {
  recoveryReasonForPersistenceError,
  recoveryReasonForTransactionError,
} from './recovery';

describe('critical recovery source mapping', () => {
  it.each([
    ['PERSISTENCE_UNAVAILABLE', 'DATABASE_UNAVAILABLE'],
    ['PERSISTENCE_QUERY_FAILED', 'DATABASE_READ_FAILED'],
    ['PERSISTENCE_WRITE_FAILED', 'DATABASE_WRITE_FAILED'],
    ['PERSISTENCE_CORRUPT_DATA', 'DURABLE_DATA_CORRUPT'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(
      recoveryReasonForPersistenceError({
        kind: 'persistence_error',
        code,
        entity: 'sessions',
        field: null,
      }),
    ).toBe(expected);
  });

  it('maps economy mismatch but leaves expected conflicts recoverable by the caller', () => {
    expect(
      recoveryReasonForPersistenceError({
        kind: 'persistence_error',
        code: 'PERSISTENCE_INVARIANT_MISMATCH',
        entity: 'pet_profiles',
        field: 'coin_balance',
      }),
    ).toBe('BOOTSTRAP_ECONOMY_INVARIANT_FAILED');
    expect(
      recoveryReasonForPersistenceError({
        kind: 'persistence_error',
        code: 'PERSISTENCE_CONFLICT',
        entity: 'sessions',
        field: null,
      }),
    ).toBeNull();
  });

  it.each([
    ['DATABASE_NOT_OPEN', 'DATABASE_UNAVAILABLE'],
    ['TRANSACTION_BEGIN_FAILED', 'DATABASE_WRITE_FAILED'],
    ['TRANSACTION_COMMIT_FAILED', 'DATABASE_WRITE_FAILED'],
    ['TRANSACTION_ROLLBACK_FAILED', 'DATABASE_WRITE_FAILED'],
    ['TRANSACTION_WORK_FAILED', 'DATABASE_WRITE_FAILED'],
    ['TRANSACTION_BUSY', null],
  ] as const)('maps transaction %s to %s', (code, expected) => {
    expect(
      recoveryReasonForTransactionError({
        kind: 'transaction_technical_error',
        code,
      }),
    ).toBe(expected);
  });
});
