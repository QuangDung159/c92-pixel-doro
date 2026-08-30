import type {
  ApplicationResult,
  TransactionTechnicalError,
} from '@pixeldoro/application';

export type MigrationErrorCode =
  | 'MIGRATION_REGISTRY_INVALID'
  | 'MIGRATION_HISTORY_MISSING'
  | 'MIGRATION_HISTORY_INVALID'
  | 'MIGRATION_VERSION_GAP'
  | 'MIGRATION_UNKNOWN_APPLIED'
  | 'MIGRATION_CHECKSUM_MISMATCH'
  | 'DATABASE_SCHEMA_NEWER_THAN_BINARY'
  | 'MIGRATION_APPLY_FAILED'
  | 'MIGRATION_HISTORY_WRITE_FAILED';

export interface MigrationError {
  readonly kind: 'migration_error';
  readonly code: MigrationErrorCode;
}

export const migrationError = (code: MigrationErrorCode): MigrationError => ({
  kind: 'migration_error',
  code,
});

export type MigrationRunError = MigrationError | TransactionTechnicalError;

export interface MigrationResult {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly appliedVersions: readonly number[];
}

export interface MigrationPort {
  migrate(): Promise<ApplicationResult<MigrationResult, MigrationRunError>>;
}
