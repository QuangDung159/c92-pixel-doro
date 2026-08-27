import type { ApplicationResult } from '@pixeldoro/application';

export type DatabaseLifecycleErrorCode =
  | 'DATABASE_OPEN_FAILED'
  | 'DATABASE_CLOSE_FAILED';

export interface DatabaseLifecycleError {
  readonly kind: 'database_lifecycle_error';
  readonly code: DatabaseLifecycleErrorCode;
}

export const databaseLifecycleError = (
  code: DatabaseLifecycleErrorCode,
): DatabaseLifecycleError => ({
  kind: 'database_lifecycle_error',
  code,
});

export interface DatabaseLifecyclePort {
  open(): Promise<ApplicationResult<void, DatabaseLifecycleError>>;
  close(): Promise<ApplicationResult<void, DatabaseLifecycleError>>;
}
