import type {
  ApplicationResult,
  PersistenceError,
  PersistenceResult,
  TransactionPort,
  TransactionTechnicalError,
} from '@pixeldoro/application';
import { persistenceError } from '@pixeldoro/application';

import type {
  AnalyticsEventRecord,
  AnalyticsEventRepository,
  UpdateAnalyticsDeliveryInput,
} from './analytics-event.repository';

export const ANALYTICS_QUEUE_CAPACITY = 1_000;
export const ANALYTICS_EVENT_TTL_MS = 604_800_000;

export type AnalyticsEnqueueOutcome = 'enqueued' | 'already_queued';

export interface AnalyticsQueue {
  enqueueBounded(
    event: AnalyticsEventRecord,
    nowMs: number,
  ): Promise<PersistenceResult<AnalyticsEnqueueOutcome>>;
  listDue(
    nowMs: number,
    limit: number,
  ): Promise<PersistenceResult<readonly AnalyticsEventRecord[]>>;
  markRetry(
    input: UpdateAnalyticsDeliveryInput,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
  deleteDelivered(
    eventIds: readonly string[],
  ): Promise<PersistenceResult<number>>;
  clear(): Promise<PersistenceResult<number>>;
}

const isPersistenceError = (
  error: PersistenceError | TransactionTechnicalError,
): error is PersistenceError => error.kind === 'persistence_error';

export class BoundedAnalyticsQueue implements AnalyticsQueue {
  constructor(
    private readonly transaction: TransactionPort,
    private readonly repository: AnalyticsEventRepository,
  ) {}

  async enqueueBounded(
    event: AnalyticsEventRecord,
    nowMs: number,
  ): Promise<PersistenceResult<AnalyticsEnqueueOutcome>> {
    const result = await this.transaction.execute<AnalyticsEnqueueOutcome, PersistenceError>(
      async (scope) => {
        const cleaned = await this.repository.deleteExpiredInTransaction(scope, nowMs);
        if (!cleaned.ok) return cleaned;

        const existing = await this.repository.findByIdInTransaction(scope, event.eventId);
        if (!existing.ok) return existing;
        if (existing.value !== null) return { ok: true, value: 'already_queued' };

        const count = await this.repository.countInTransaction(scope);
        if (!count.ok) return count;
        const rowsToDrop = Math.max(0, count.value - ANALYTICS_QUEUE_CAPACITY + 1);
        if (rowsToDrop > 0) {
          const dropped = await this.repository.deleteOldestInTransaction(scope, rowsToDrop);
          if (!dropped.ok) return dropped;
        }

        const inserted = await this.repository.insertInTransaction(scope, event, nowMs);
        return inserted.ok
          ? { ok: true, value: 'enqueued' }
          : inserted;
      },
    );
    return this.mapTransactionResult(result);
  }

  async listDue(
    nowMs: number,
    limit: number,
  ): Promise<PersistenceResult<readonly AnalyticsEventRecord[]>> {
    const result = await this.transaction.execute<
      readonly AnalyticsEventRecord[],
      PersistenceError
    >(async (scope) => {
      const cleaned = await this.repository.deleteExpiredInTransaction(scope, nowMs);
      return cleaned.ok
        ? this.repository.listDueInTransaction(scope, nowMs, limit)
        : cleaned;
    });
    return this.mapTransactionResult(result);
  }

  async markRetry(
    input: UpdateAnalyticsDeliveryInput,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>> {
    if (
      input.deliveryState !== 'retry_wait' || input.attemptCount < 1 ||
      input.nextAttemptAt === null
    ) {
      return {
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events', 'retry_input'),
      };
    }
    const result = await this.transaction.execute<'updated' | 'not_updated', PersistenceError>(
      (scope) => this.repository.updateDeliveryInTransaction(scope, input),
    );
    return this.mapTransactionResult(result);
  }

  async deleteDelivered(
    eventIds: readonly string[],
  ): Promise<PersistenceResult<number>> {
    const result = await this.transaction.execute<number, PersistenceError>(
      (scope) => this.repository.deleteByIdsInTransaction(scope, eventIds),
    );
    return this.mapTransactionResult(result);
  }

  async clear(): Promise<PersistenceResult<number>> {
    const result = await this.transaction.execute<number, PersistenceError>(
      (scope) => this.repository.clearInTransaction(scope),
    );
    return this.mapTransactionResult(result);
  }

  private mapTransactionResult<TValue>(
    result: ApplicationResult<
      TValue,
      PersistenceError | TransactionTechnicalError
    >,
  ): PersistenceResult<TValue> {
    if (result.ok) return { ok: true, value: result.value };
    if (isPersistenceError(result.error)) return { ok: false, error: result.error };
    return {
      ok: false,
      error: {
        kind: 'persistence_error',
        code: result.error.code === 'DATABASE_NOT_OPEN'
          ? 'PERSISTENCE_UNAVAILABLE'
          : 'PERSISTENCE_WRITE_FAILED',
        entity: 'analytics_events',
        field: null,
      },
    };
  }
}
