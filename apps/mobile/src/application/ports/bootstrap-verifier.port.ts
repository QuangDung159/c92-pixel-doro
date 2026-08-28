import type { ApplicationResult } from '@pixeldoro/application';

export interface BootstrapVerificationError {
  readonly kind: 'bootstrap_verification_error';
  readonly code: 'BOOTSTRAP_INVARIANT_FAILED';
}

export const bootstrapVerificationError = (): BootstrapVerificationError => ({
  kind: 'bootstrap_verification_error',
  code: 'BOOTSTRAP_INVARIANT_FAILED',
});

export interface BootstrapVerifierPort {
  verify(): Promise<ApplicationResult<void, BootstrapVerificationError>>;
}
