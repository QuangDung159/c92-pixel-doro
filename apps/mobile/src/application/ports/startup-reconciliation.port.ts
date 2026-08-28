import type { ApplicationResult } from '@pixeldoro/application';

export interface StartupReconciliationError {
  readonly kind: 'startup_reconciliation_error';
  readonly code: 'STARTUP_RECONCILIATION_FAILED';
}

export const startupReconciliationError = (): StartupReconciliationError => ({
  kind: 'startup_reconciliation_error',
  code: 'STARTUP_RECONCILIATION_FAILED',
});

export interface StartupReconciliationPort {
  reconcileAtStartup(): Promise<
    ApplicationResult<void, StartupReconciliationError>
  >;
}
