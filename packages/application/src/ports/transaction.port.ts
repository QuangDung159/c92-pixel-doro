import type { ApplicationResult } from '../result/application-result';
import type { TransactionTechnicalError } from './transaction.error';

export interface TransactionScope {
  readonly transactionId: symbol;
}

export interface TransactionPort {
  execute<TValue, TError>(
    work: (
      scope: TransactionScope,
    ) => Promise<ApplicationResult<TValue, TError>>,
  ): Promise<ApplicationResult<TValue, TError | TransactionTechnicalError>>;
}
