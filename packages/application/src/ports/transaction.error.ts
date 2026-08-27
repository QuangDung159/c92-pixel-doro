export type TransactionTechnicalErrorCode =
  | 'DATABASE_NOT_OPEN'
  | 'TRANSACTION_BUSY'
  | 'TRANSACTION_BEGIN_FAILED'
  | 'TRANSACTION_COMMIT_FAILED'
  | 'TRANSACTION_ROLLBACK_FAILED'
  | 'TRANSACTION_WORK_FAILED';

export interface TransactionTechnicalError {
  readonly kind: 'transaction_technical_error';
  readonly code: TransactionTechnicalErrorCode;
}

export const transactionTechnicalError = (
  code: TransactionTechnicalErrorCode,
): TransactionTechnicalError => ({
  kind: 'transaction_technical_error',
  code,
});
