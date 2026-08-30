import type {
  ApplicationResult,
  ClockPort,
  IdPort,
  PersistenceError,
  PersistenceResult,
  SessionRepository,
  TransactionPort,
  TransactionScope,
  TransactionTechnicalError,
} from '@pixeldoro/application';

import type { BootstrapDurableSnapshot } from '../ports/bootstrap-data.port';
import type { RecoveryReasonCode } from '../recovery';

export interface ConfirmedResetLease {
  readonly resetId: symbol;
}

export interface ConfirmedResetAvailabilityError {
  readonly kind: 'confirmed_reset_availability_error';
  readonly code: 'RESET_NOT_AVAILABLE';
}

export interface ConfirmedResetBootstrapError {
  readonly kind: 'confirmed_reset_bootstrap_error';
  readonly code: RecoveryReasonCode;
}

export interface ConfirmedResetBootstrapPort {
  beginConfirmedReset(): ApplicationResult<
    ConfirmedResetLease,
    ConfirmedResetAvailabilityError
  >;
  restoreAfterFailedConfirmedReset(lease: ConfirmedResetLease): void;
  enterRecoveryAfterUncertainConfirmedReset(lease: ConfirmedResetLease): void;
  rebootstrapAfterCommittedConfirmedReset(
    lease: ConfirmedResetLease,
  ): Promise<
    ApplicationResult<BootstrapDurableSnapshot, ConfirmedResetBootstrapError>
  >;
}

export interface ConfirmedResetSeed {
  readonly nowMs: number;
  readonly anonymousAnalyticsId: string;
}

export interface ConfirmedResetPersistenceSummary {
  readonly clearedAnalyticsEvents: number;
  readonly clearedOwnedItems: number;
  readonly clearedPurchaseTransactions: number;
  readonly clearedRewardTransactions: number;
  readonly clearedSessions: number;
  readonly clearedStoreReviewAttempts: number;
}

export interface ConfirmedResetPersistencePort {
  resetInTransaction(
    scope: TransactionScope,
    seed: ConfirmedResetSeed,
  ): Promise<PersistenceResult<ConfirmedResetPersistenceSummary>>;
}

export interface ResetNotificationCleanupError {
  readonly kind: 'reset_notification_cleanup_error';
  readonly code: 'RESET_NOTIFICATION_CLEANUP_FAILED';
}

export interface ResetNotificationCleanupPort {
  cancelKnownSession(
    sessionId: string | null,
  ): Promise<ApplicationResult<void, ResetNotificationCleanupError>>;
}

export type ConfirmedResetWarningCode =
  | 'ACTIVE_SESSION_LOOKUP_FAILED'
  | 'NOTIFICATION_CLEANUP_FAILED';

export interface ConfirmedResetWarning {
  readonly code: ConfirmedResetWarningCode;
}

export type ConfirmedResetErrorCode =
  | 'RESET_NOT_AVAILABLE'
  | 'RESET_INVALID_SEED'
  | 'RESET_PERSISTENCE_FAILED'
  | 'RESET_TRANSACTION_FAILED'
  | 'RESET_COMMITTED_BOOTSTRAP_FAILED';

export interface ConfirmedResetError {
  readonly kind: 'confirmed_reset_error';
  readonly code: ConfirmedResetErrorCode;
}

export interface ConfirmedResetSuccess {
  readonly snapshot: BootstrapDurableSnapshot;
  readonly persistence: ConfirmedResetPersistenceSummary;
}

export type ConfirmedResetDiagnosticEventName =
  | 'confirmed_reset_started'
  | 'confirmed_reset_warning'
  | 'confirmed_reset_transaction_failed'
  | 'confirmed_reset_committed'
  | 'confirmed_reset_ready'
  | 'confirmed_reset_recovery';

export interface ConfirmedResetDiagnostic {
  readonly eventName: ConfirmedResetDiagnosticEventName;
  readonly attemptNumber: number;
  readonly errorCode: ConfirmedResetErrorCode | null;
  readonly warningCode: ConfirmedResetWarningCode | null;
}

export interface ConfirmedResetDiagnosticsPort {
  record(diagnostic: ConfirmedResetDiagnostic): void;
}

export interface ConfirmedLocalDataResetDependencies {
  readonly activeSessions: Pick<SessionRepository, 'findActive'>;
  readonly bootstrap: ConfirmedResetBootstrapPort;
  readonly clock: ClockPort;
  readonly diagnostics: ConfirmedResetDiagnosticsPort;
  readonly id: IdPort;
  readonly notificationCleanup: ResetNotificationCleanupPort;
  readonly persistence: ConfirmedResetPersistencePort;
  readonly transaction: TransactionPort;
}

const resetError = (code: ConfirmedResetErrorCode): ConfirmedResetError => ({
  kind: 'confirmed_reset_error',
  code,
});

const isValidSeed = (seed: ConfirmedResetSeed): boolean =>
  Number.isSafeInteger(seed.nowMs) &&
  seed.nowMs >= 0 &&
  seed.nowMs <= 8_640_000_000_000_000 &&
  seed.anonymousAnalyticsId.trim().length > 0;

const isTransactionError = (
  error: PersistenceError | TransactionTechnicalError,
): error is TransactionTechnicalError => error.kind === 'transaction_technical_error';

export class ConfirmedLocalDataReset {
  private operation: Promise<
    ApplicationResult<ConfirmedResetSuccess, ConfirmedResetError>
  > | undefined;
  private attemptNumber = 0;

  constructor(private readonly dependencies: ConfirmedLocalDataResetDependencies) {}

  execute(): Promise<ApplicationResult<ConfirmedResetSuccess, ConfirmedResetError>> {
    if (this.operation !== undefined) {
      return this.operation;
    }

    const operation = this.run();
    this.operation = operation;
    const clear = () => {
      if (this.operation === operation) this.operation = undefined;
    };
    void operation.then(clear, clear);
    return operation;
  }

  private async run(): Promise<
    ApplicationResult<ConfirmedResetSuccess, ConfirmedResetError>
  > {
    this.attemptNumber += 1;
    const attemptNumber = this.attemptNumber;
    const leaseResult = this.dependencies.bootstrap.beginConfirmedReset();
    if (!leaseResult.ok) {
      return { ok: false, error: resetError('RESET_NOT_AVAILABLE') };
    }

    const lease = leaseResult.value;
    this.record({
      eventName: 'confirmed_reset_started',
      attemptNumber,
      errorCode: null,
      warningCode: null,
    });
    const warnings: ConfirmedResetWarning[] = [];

    let activeSessionId: string | null = null;
    try {
      const activeSession = await this.dependencies.activeSessions.findActive();
      if (activeSession.ok) {
        activeSessionId = activeSession.value?.id ?? null;
      } else {
        this.addWarning(warnings, attemptNumber, 'ACTIVE_SESSION_LOOKUP_FAILED');
      }
    } catch {
      this.addWarning(warnings, attemptNumber, 'ACTIVE_SESSION_LOOKUP_FAILED');
    }

    try {
      const cleanup =
        await this.dependencies.notificationCleanup.cancelKnownSession(activeSessionId);
      if (!cleanup.ok) {
        this.addWarning(warnings, attemptNumber, 'NOTIFICATION_CLEANUP_FAILED');
      }
    } catch {
      this.addWarning(warnings, attemptNumber, 'NOTIFICATION_CLEANUP_FAILED');
    }

    let seed: ConfirmedResetSeed;
    try {
      seed = {
        nowMs: this.dependencies.clock.nowMs(),
        anonymousAnalyticsId: this.dependencies.id.nextId(),
      };
    } catch {
      this.dependencies.bootstrap.restoreAfterFailedConfirmedReset(lease);
      return { ok: false, error: resetError('RESET_INVALID_SEED') };
    }

    if (!isValidSeed(seed)) {
      this.dependencies.bootstrap.restoreAfterFailedConfirmedReset(lease);
      return { ok: false, error: resetError('RESET_INVALID_SEED') };
    }

    const transactionResult = await this.dependencies.transaction.execute((scope) =>
      this.dependencies.persistence.resetInTransaction(scope, seed),
    );

    if (!transactionResult.ok) {
      const uncertain =
        isTransactionError(transactionResult.error) &&
        transactionResult.error.code === 'TRANSACTION_ROLLBACK_FAILED';
      if (uncertain) {
        this.dependencies.bootstrap.enterRecoveryAfterUncertainConfirmedReset(lease);
      } else {
        this.dependencies.bootstrap.restoreAfterFailedConfirmedReset(lease);
      }
      const code = isTransactionError(transactionResult.error)
        ? 'RESET_TRANSACTION_FAILED'
        : 'RESET_PERSISTENCE_FAILED';
      this.record({
        eventName: uncertain
          ? 'confirmed_reset_recovery'
          : 'confirmed_reset_transaction_failed',
        attemptNumber,
        errorCode: code,
        warningCode: null,
      });
      return { ok: false, error: resetError(code) };
    }

    this.record({
      eventName: 'confirmed_reset_committed',
      attemptNumber,
      errorCode: null,
      warningCode: null,
    });
    const bootstrapResult =
      await this.dependencies.bootstrap.rebootstrapAfterCommittedConfirmedReset(lease);
    if (!bootstrapResult.ok) {
      this.record({
        eventName: 'confirmed_reset_recovery',
        attemptNumber,
        errorCode: 'RESET_COMMITTED_BOOTSTRAP_FAILED',
        warningCode: null,
      });
      return {
        ok: false,
        error: resetError('RESET_COMMITTED_BOOTSTRAP_FAILED'),
      };
    }

    this.record({
      eventName: 'confirmed_reset_ready',
      attemptNumber,
      errorCode: null,
      warningCode: null,
    });
    return {
      ok: true,
      value: {
        snapshot: bootstrapResult.value,
        persistence: transactionResult.value,
      },
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  }

  private addWarning(
    warnings: ConfirmedResetWarning[],
    attemptNumber: number,
    code: ConfirmedResetWarningCode,
  ): void {
    warnings.push({ code });
    this.record({
      eventName: 'confirmed_reset_warning',
      attemptNumber,
      errorCode: null,
      warningCode: code,
    });
  }

  private record(diagnostic: ConfirmedResetDiagnostic): void {
    try {
      this.dependencies.diagnostics.record(diagnostic);
    } catch {
      // Diagnostics are best effort and cannot alter reset correctness.
    }
  }
}
