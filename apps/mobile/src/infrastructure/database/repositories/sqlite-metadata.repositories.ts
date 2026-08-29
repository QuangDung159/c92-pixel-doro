import {
  persistenceError,
  type TransactionScope,
} from '@pixeldoro/application';
import type {
  AnalyticsEventRecord,
  AnalyticsEventRepository,
  StoreReviewAttemptRecord,
  StoreReviewAttemptRepository,
  UpdateAnalyticsDeliveryInput,
} from '@/application';

import {
  mapAnalyticsEventRow,
  mapStoreReviewAttemptRow,
  serializeAnalyticsProperties,
  type AnalyticsEventRow,
  type StoreReviewAttemptRow,
} from '../mappers/metadata-row.mapper';
import {
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isSafeTimestamp,
} from '../mappers/row-mapping';
import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import {
  mapWriteError,
  readMappedAll,
  readMappedOne,
  readWithOwner,
  withTransactionExecutor,
  writeWithOwner,
} from './sqlite-repository-support';

const reviewSelect = `SELECT id, app_version, attempted_at, created_at
  FROM store_review_attempts`;
const analyticsSelect = `SELECT event_id, event_name, properties_json, occurred_at,
  expires_at, delivery_state, attempt_count, next_attempt_at, created_at
  FROM analytics_events`;

const reviewToRow = (record: StoreReviewAttemptRecord): StoreReviewAttemptRow => ({
  id: record.id,
  app_version: record.appVersion,
  attempted_at: record.attemptedAt,
  created_at: record.createdAt,
});

const analyticsToRow = (
  record: AnalyticsEventRecord,
  propertiesJson: string,
): AnalyticsEventRow => ({
  event_id: record.eventId,
  event_name: record.eventName,
  properties_json: propertiesJson,
  occurred_at: record.occurredAt,
  expires_at: record.expiresAt,
  delivery_state: record.deliveryState,
  attempt_count: record.attemptCount,
  next_attempt_at: record.nextAttemptAt,
  created_at: record.createdAt,
});

export class SQLiteStoreReviewAttemptRepository implements StoreReviewAttemptRepository {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  findByAppVersion(appVersion: string): ReturnType<StoreReviewAttemptRepository['findByAppVersion']> {
    if (!isNonEmptyString(appVersion)) return invalidQuery('store_review_attempts', 'app_version');
    return readWithOwner(this.owner, 'store_review_attempts', (executor) =>
      readMappedOne(executor, 'store_review_attempts',
        `${reviewSelect} WHERE app_version = ?`, [appVersion], mapStoreReviewAttemptRow));
  }

  list(): ReturnType<StoreReviewAttemptRepository['list']> {
    return readWithOwner(this.owner, 'store_review_attempts', (executor) =>
      readMappedAll(executor, 'store_review_attempts',
        `${reviewSelect} ORDER BY attempted_at DESC`, [], mapStoreReviewAttemptRow));
  }

  insert(record: StoreReviewAttemptRecord): ReturnType<StoreReviewAttemptRepository['insert']> {
    const validation = mapStoreReviewAttemptRow(reviewToRow(record));
    if (!validation.ok) return invalidWrite('store_review_attempts', validation.field);
    return writeWithOwner(this.owner, 'store_review_attempts', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO store_review_attempts (id, app_version, attempted_at, created_at)
            VALUES (?, ?, ?, ?)`,
          [record.id, record.appVersion, record.attemptedAt, record.createdAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'store_review_attempts') };
      }
    });
  }
}

export class SQLiteAnalyticsEventRepository implements AnalyticsEventRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  findById(eventId: string): ReturnType<AnalyticsEventRepository['findById']> {
    if (!isNonEmptyString(eventId)) return invalidQuery('analytics_events', 'event_id');
    return readWithOwner(this.owner, 'analytics_events', (executor) =>
      readMappedOne(executor, 'analytics_events', `${analyticsSelect} WHERE event_id = ?`,
        [eventId], mapAnalyticsEventRow));
  }

  findByIdInTransaction(
    scope: TransactionScope,
    eventId: string,
  ): ReturnType<AnalyticsEventRepository['findByIdInTransaction']> {
    if (!isNonEmptyString(eventId)) return invalidQuery('analytics_events', 'event_id');
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', (executor) =>
      readMappedOne(executor, 'analytics_events', `${analyticsSelect} WHERE event_id = ?`,
        [eventId], mapAnalyticsEventRow));
  }

  countInTransaction(
    scope: TransactionScope,
  ): ReturnType<AnalyticsEventRepository['countInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', async (executor) => {
      try {
        const row = await executor.getFirst<{ readonly count: unknown }>(
          'SELECT COUNT(*) AS count FROM analytics_events',
          [],
        );
        if (row === null || !isNonNegativeSafeInteger(row.count)) {
          return {
            ok: false,
            error: persistenceError(
              'PERSISTENCE_CORRUPT_DATA', 'analytics_events', 'count'),
          };
        }
        return { ok: true, value: row.count };
      } catch {
        return {
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'analytics_events'),
        };
      }
    });
  }

  deleteExpiredInTransaction(
    scope: TransactionScope,
    nowMs: number,
  ): ReturnType<AnalyticsEventRepository['deleteExpiredInTransaction']> {
    if (!isSafeTimestamp(nowMs)) return invalidWrite('analytics_events', 'now_ms');
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', async (executor) => {
      try {
        const result = await executor.run(
          'DELETE FROM analytics_events WHERE expires_at <= ?',
          [nowMs],
        );
        return { ok: true, value: result.changes };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }

  deleteOldestInTransaction(
    scope: TransactionScope,
    count: number,
  ): ReturnType<AnalyticsEventRepository['deleteOldestInTransaction']> {
    if (!Number.isSafeInteger(count) || count < 1) {
      return invalidWrite('analytics_events', 'count');
    }
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', async (executor) => {
      try {
        const result = await executor.run(
          `DELETE FROM analytics_events WHERE event_id IN (
            SELECT event_id FROM analytics_events
            ORDER BY occurred_at ASC, event_id ASC LIMIT ?
          )`,
          [count],
        );
        return { ok: true, value: result.changes };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }

  insertInTransaction(
    scope: TransactionScope,
    record: AnalyticsEventRecord,
    nowMs: number,
  ): ReturnType<AnalyticsEventRepository['insertInTransaction']> {
    if (
      !isSafeTimestamp(nowMs) || record.expiresAt <= nowMs ||
      record.deliveryState !== 'pending' || record.attemptCount !== 0 ||
      record.nextAttemptAt !== null
    ) return invalidWrite('analytics_events', 'enqueue_input');
    const properties = serializeAnalyticsProperties(record.properties);
    if (!properties.ok) return invalidWrite('analytics_events', properties.field);
    const validation = mapAnalyticsEventRow(analyticsToRow(record, properties.value));
    if (!validation.ok) return invalidWrite('analytics_events', validation.field);
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', (executor) =>
      insertAnalyticsEvent(executor, record, properties.value));
  }

  listDue(
    nowMs: number,
    limit: number,
  ): ReturnType<AnalyticsEventRepository['listDue']> {
    if (
      !isSafeTimestamp(nowMs) || !Number.isSafeInteger(limit) ||
      limit < 1 || limit > 1_000
    ) return invalidQuery('analytics_events', 'due_input');
    return readWithOwner(this.owner, 'analytics_events', (executor) =>
      readDue(executor, nowMs, limit));
  }

  listDueInTransaction(
    scope: TransactionScope,
    nowMs: number,
    limit: number,
  ): ReturnType<AnalyticsEventRepository['listDueInTransaction']> {
    if (
      !isSafeTimestamp(nowMs) || !Number.isSafeInteger(limit) ||
      limit < 1 || limit > 1_000
    ) return invalidQuery('analytics_events', 'due_input');
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', (executor) =>
      readDue(executor, nowMs, limit));
  }

  updateDeliveryInTransaction(
    scope: TransactionScope,
    input: Parameters<AnalyticsEventRepository['updateDeliveryInTransaction']>[1],
  ): ReturnType<AnalyticsEventRepository['updateDeliveryInTransaction']> {
    if (!isValidDeliveryInput(input)) return invalidWrite('analytics_events', 'input');
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', (executor) =>
      updateDelivery(executor, input));
  }

  deleteByIdsInTransaction(
    scope: TransactionScope,
    eventIds: readonly string[],
  ): ReturnType<AnalyticsEventRepository['deleteByIdsInTransaction']> {
    if (
      eventIds.length < 1 || eventIds.length > 1_000 ||
      new Set(eventIds).size !== eventIds.length ||
      eventIds.some((eventId) => !isNonEmptyString(eventId))
    ) return invalidWrite('analytics_events', 'event_ids');
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', async (executor) => {
      try {
        const placeholders = eventIds.map(() => '?').join(', ');
        const result = await executor.run(
          `DELETE FROM analytics_events WHERE event_id IN (${placeholders})`,
          [...eventIds],
        );
        return { ok: true, value: result.changes };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }

  clearInTransaction(
    scope: TransactionScope,
  ): ReturnType<AnalyticsEventRepository['clearInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'analytics_events', async (executor) => {
      try {
        const result = await executor.run('DELETE FROM analytics_events', []);
        return { ok: true, value: result.changes };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }
}

const isValidDeliveryInput = (
  input: UpdateAnalyticsDeliveryInput,
): boolean => isNonEmptyString(input.eventId) &&
  isNonNegativeSafeInteger(input.attemptCount) &&
  ((input.deliveryState === 'pending' && input.nextAttemptAt === null) ||
    (input.deliveryState === 'retry_wait' && input.attemptCount > 0 &&
      isSafeTimestamp(input.nextAttemptAt)));

const insertAnalyticsEvent = async (
  executor: SQLiteExecutor,
  record: AnalyticsEventRecord,
  propertiesJson: string,
) => {
  try {
    await executor.run(
      `INSERT INTO analytics_events (event_id, event_name, properties_json, occurred_at,
        expires_at, delivery_state, attempt_count, next_attempt_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.eventId, record.eventName, propertiesJson, record.occurredAt,
        record.expiresAt, record.deliveryState, record.attemptCount,
        record.nextAttemptAt, record.createdAt],
    );
    return { ok: true as const, value: undefined };
  } catch (error) {
    return { ok: false as const, error: mapWriteError(error, 'analytics_events') };
  }
};

const updateDelivery = async (
  executor: SQLiteExecutor,
  input: UpdateAnalyticsDeliveryInput,
) => {
  try {
    const result = await executor.run(
      `UPDATE analytics_events SET delivery_state = ?, attempt_count = ?,
        next_attempt_at = ? WHERE event_id = ?`,
      [input.deliveryState, input.attemptCount, input.nextAttemptAt, input.eventId],
    );
    return {
      ok: true as const,
      value: result.changes === 1 ? 'updated' as const : 'not_updated' as const,
    };
  } catch (error) {
    return { ok: false as const, error: mapWriteError(error, 'analytics_events') };
  }
};

const readDue = (
  executor: SQLiteExecutor,
  nowMs: number,
  limit: number,
) => readMappedAll(
  executor,
  'analytics_events',
  `${analyticsSelect}
    WHERE delivery_state = 'pending'
      OR (delivery_state = 'retry_wait' AND next_attempt_at <= ?)
    ORDER BY CASE delivery_state WHEN 'pending' THEN 0 ELSE 1 END,
      CASE WHEN delivery_state = 'pending' THEN occurred_at ELSE next_attempt_at END,
      occurred_at, event_id
    LIMIT ?`,
  [nowMs, limit],
  mapAnalyticsEventRow,
);

const invalidWrite = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_WRITE_FAILED', entity, field),
});

const invalidQuery = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_QUERY_FAILED', entity, field),
});
