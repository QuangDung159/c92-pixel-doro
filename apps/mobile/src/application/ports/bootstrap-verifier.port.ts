import type { ApplicationResult } from '@pixeldoro/application';

export type BootstrapVerificationErrorCode =
  | 'DATABASE_READ_FAILED'
  | 'DURABLE_DATA_CORRUPT'
  | 'BOOTSTRAP_SCHEMA_INVARIANT_FAILED'
  | 'BOOTSTRAP_SEED_INVALID'
  | 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED';

export interface BootstrapVerificationError {
  readonly kind: 'bootstrap_verification_error';
  readonly code: BootstrapVerificationErrorCode;
}

export const bootstrapVerificationError = (
  code: BootstrapVerificationErrorCode,
): BootstrapVerificationError => ({
  kind: 'bootstrap_verification_error',
  code,
});

export interface BootstrapVerifierPort {
  verify(): Promise<ApplicationResult<void, BootstrapVerificationError>>;
}
