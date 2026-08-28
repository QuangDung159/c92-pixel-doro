import { persistenceError } from '@pixeldoro/application';
import type {
  AnalyticsEventRecord,
  AnalyticsEventRepository,
  StoreReviewAttemptRecord,
  StoreReviewAttemptRepository,
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
import {
  mapWriteError,
  readMappedAll,
  readMappedOne,
  readWithOwner,
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
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  findById(eventId: string): ReturnType<AnalyticsEventRepository['findById']> {
    if (!isNonEmptyString(eventId)) return invalidQuery('analytics_events', 'event_id');
    return readWithOwner(this.owner, 'analytics_events', (executor) =>
      readMappedOne(executor, 'analytics_events', `${analyticsSelect} WHERE event_id = ?`,
        [eventId], mapAnalyticsEventRow));
  }

  listPending(limit: number): ReturnType<AnalyticsEventRepository['listPending']> {
    if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 1_000) {
      return invalidQuery('analytics_events', 'limit');
    }
    return readWithOwner(this.owner, 'analytics_events', (executor) =>
      readMappedAll(executor, 'analytics_events',
        `${analyticsSelect} WHERE delivery_state IN ('pending', 'retry_wait')
          ORDER BY occurred_at, event_id LIMIT ?`, [limit], mapAnalyticsEventRow));
  }

  insert(record: AnalyticsEventRecord): ReturnType<AnalyticsEventRepository['insert']> {
    const properties = serializeAnalyticsProperties(record.properties);
    if (!properties.ok) return invalidWrite('analytics_events', properties.field);
    const validation = mapAnalyticsEventRow(analyticsToRow(record, properties.value));
    if (!validation.ok) return invalidWrite('analytics_events', validation.field);
    return writeWithOwner(this.owner, 'analytics_events', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO analytics_events (event_id, event_name, properties_json, occurred_at,
            expires_at, delivery_state, attempt_count, next_attempt_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [record.eventId, record.eventName, properties.value, record.occurredAt,
            record.expiresAt, record.deliveryState, record.attemptCount,
            record.nextAttemptAt, record.createdAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }

  updateDelivery(
    input: Parameters<AnalyticsEventRepository['updateDelivery']>[0],
  ): ReturnType<AnalyticsEventRepository['updateDelivery']> {
    const valid = isNonEmptyString(input.eventId) &&
      isNonNegativeSafeInteger(input.attemptCount) &&
      (input.nextAttemptAt === null || isSafeTimestamp(input.nextAttemptAt));
    if (!valid) return invalidWrite('analytics_events', 'input');
    return writeWithOwner(this.owner, 'analytics_events', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE analytics_events SET delivery_state = ?, attempt_count = ?,
            next_attempt_at = ? WHERE event_id = ?`,
          [input.deliveryState, input.attemptCount, input.nextAttemptAt, input.eventId],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'analytics_events') };
      }
    });
  }
}

const invalidWrite = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_WRITE_FAILED', entity, field),
});

const invalidQuery = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_QUERY_FAILED', entity, field),
});
