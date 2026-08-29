import type {
  PersistenceError,
  TransactionTechnicalError,
} from '@pixeldoro/application';

import type { MigrationErrorCode } from '../ports/migration.port';

export type BootstrapPhase =
  | 'opening'
  | 'migrating'
  | 'verifying'
  | 'hydrating'
  | 'reconciling';

export type RecoveryPhase = BootstrapPhase | 'runtime';

export type RuntimeRecoveryReasonCode =
  | 'DATABASE_UNAVAILABLE'
  | 'DATABASE_READ_FAILED'
  | 'DATABASE_WRITE_FAILED'
  | 'DURABLE_DATA_CORRUPT'
  | 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED';

export type RecoveryReasonCode =
  | 'DATABASE_OPEN_FAILED'
  | RuntimeRecoveryReasonCode
  | MigrationErrorCode
  | 'MIGRATION_EXECUTION_FAILED'
  | 'BOOTSTRAP_SCHEMA_INVARIANT_FAILED'
  | 'BOOTSTRAP_SEED_INVALID'
  | 'BOOTSTRAP_DATA_INVALID'
  | 'STARTUP_RECONCILIATION_FAILED';

export interface CriticalRecoveryPort {
  enterRecovery(reasonCode: RuntimeRecoveryReasonCode): void;
}

export type RecoveryDiagnosticEventName =
  | 'recovery_entered'
  | 'recovery_retry_started'
  | 'recovery_retry_succeeded';

export interface RecoveryDiagnostic {
  readonly eventName: RecoveryDiagnosticEventName;
  readonly attemptNumber: number;
  readonly phase: RecoveryPhase;
  readonly reasonCode: RecoveryReasonCode | null;
}

export interface RecoveryDiagnosticsPort {
  record(diagnostic: RecoveryDiagnostic): void;
}

export const recoveryReasonForPersistenceError = (
  error: PersistenceError,
): RuntimeRecoveryReasonCode | null => {
  switch (error.code) {
    case 'PERSISTENCE_UNAVAILABLE':
      return 'DATABASE_UNAVAILABLE';
    case 'PERSISTENCE_QUERY_FAILED':
      return 'DATABASE_READ_FAILED';
    case 'PERSISTENCE_WRITE_FAILED':
      return 'DATABASE_WRITE_FAILED';
    case 'PERSISTENCE_CORRUPT_DATA':
      return 'DURABLE_DATA_CORRUPT';
    case 'PERSISTENCE_INVARIANT_MISMATCH':
      return error.entity === 'pet_profiles'
        ? 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED'
        : 'DURABLE_DATA_CORRUPT';
    case 'PERSISTENCE_CONFLICT':
      return null;
  }
};

export const recoveryReasonForTransactionError = (
  error: TransactionTechnicalError,
): RuntimeRecoveryReasonCode | null => {
  switch (error.code) {
    case 'DATABASE_NOT_OPEN':
      return 'DATABASE_UNAVAILABLE';
    case 'TRANSACTION_BUSY':
      return null;
    case 'TRANSACTION_BEGIN_FAILED':
    case 'TRANSACTION_COMMIT_FAILED':
    case 'TRANSACTION_ROLLBACK_FAILED':
    case 'TRANSACTION_WORK_FAILED':
      return 'DATABASE_WRITE_FAILED';
  }
};
