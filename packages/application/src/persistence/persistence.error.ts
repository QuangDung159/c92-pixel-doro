import type { ApplicationResult } from '../result/application-result';

export type PersistenceErrorCode =
  | 'PERSISTENCE_UNAVAILABLE'
  | 'PERSISTENCE_QUERY_FAILED'
  | 'PERSISTENCE_WRITE_FAILED'
  | 'PERSISTENCE_CONFLICT'
  | 'PERSISTENCE_CORRUPT_DATA';

export interface PersistenceError {
  readonly kind: 'persistence_error';
  readonly code: PersistenceErrorCode;
  readonly entity: string;
  readonly field: string | null;
}

export type PersistenceResult<TValue> = ApplicationResult<
  TValue,
  PersistenceError
>;

export type ConditionalWriteOutcome = 'updated' | 'not_updated';

export const persistenceError = (
  code: PersistenceErrorCode,
  entity: string,
  field: string | null = null,
): PersistenceError => ({
  kind: 'persistence_error',
  code,
  entity,
  field,
});
