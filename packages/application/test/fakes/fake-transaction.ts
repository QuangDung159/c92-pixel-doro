import {
  transactionTechnicalError,
  type ApplicationResult,
  type TransactionPort,
  type TransactionScope,
} from '../../src';

export class FakeTransaction implements TransactionPort {
  commits = 0;
  rollbacks = 0;
  private active = false;

  async execute<TValue, TError>(
    work: (
      scope: TransactionScope,
    ) => Promise<ApplicationResult<TValue, TError>>,
  ): Promise<
    ApplicationResult<
      TValue,
      TError | ReturnType<typeof transactionTechnicalError>
    >
  > {
    if (this.active) {
      return {
        ok: false,
        error: transactionTechnicalError('TRANSACTION_BUSY'),
      };
    }

    this.active = true;

    try {
      const result = await work({ transactionId: Symbol('fake-transaction') });

      if (result.ok) {
        this.commits += 1;
      } else {
        this.rollbacks += 1;
      }

      return result;
    } catch {
      this.rollbacks += 1;
      return {
        ok: false,
        error: transactionTechnicalError('TRANSACTION_WORK_FAILED'),
      };
    } finally {
      this.active = false;
    }
  }
}
