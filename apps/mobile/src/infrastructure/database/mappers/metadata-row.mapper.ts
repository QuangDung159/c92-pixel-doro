import type {
  AnalyticsEventRecord,
  AnalyticsProperties,
  StoreReviewAttemptRecord,
} from '@/application';

import {
  corrupt,
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isSafeTimestamp,
  mapped,
  type RowMapping,
  utf8ByteLength,
} from './row-mapping';

export interface StoreReviewAttemptRow {
  readonly id: unknown;
  readonly app_version: unknown;
  readonly attempted_at: unknown;
  readonly created_at: unknown;
}

export interface AnalyticsEventRow {
  readonly event_id: unknown;
  readonly event_name: unknown;
  readonly properties_json: unknown;
  readonly occurred_at: unknown;
  readonly expires_at: unknown;
  readonly delivery_state: unknown;
  readonly attempt_count: unknown;
  readonly next_attempt_at: unknown;
  readonly created_at: unknown;
}

const isSafePropertyValue = (value: unknown): boolean =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

export const validateAnalyticsProperties = (
  value: unknown,
): value is AnalyticsProperties => {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) return false;
  const entries = Object.entries(value);
  return entries.length <= 20 &&
    entries.every(([key, property]) => key.length > 0 && isSafePropertyValue(property));
};

export const serializeAnalyticsProperties = (
  properties: AnalyticsProperties,
): RowMapping<string> => {
  if (!validateAnalyticsProperties(properties)) return corrupt('properties');
  const serialized = JSON.stringify(properties);
  return utf8ByteLength(serialized) <= 2048
    ? mapped(serialized)
    : corrupt('properties');
};

export const mapStoreReviewAttemptRow = (
  row: StoreReviewAttemptRow,
): RowMapping<StoreReviewAttemptRecord> => {
  if (!isNonEmptyString(row.id)) return corrupt('id');
  if (!isNonEmptyString(row.app_version)) return corrupt('app_version');
  if (!isSafeTimestamp(row.attempted_at)) return corrupt('attempted_at');
  if (row.created_at !== row.attempted_at) return corrupt('created_at');
  return mapped({
    id: row.id,
    appVersion: row.app_version,
    attemptedAt: row.attempted_at,
    createdAt: row.created_at,
  });
};

export const mapAnalyticsEventRow = (
  row: AnalyticsEventRow,
): RowMapping<AnalyticsEventRecord> => {
  if (!isNonEmptyString(row.event_id)) return corrupt('event_id');
  if (!isNonEmptyString(row.event_name)) return corrupt('event_name');
  if (
    typeof row.properties_json !== 'string' ||
    utf8ByteLength(row.properties_json) > 2048
  ) return corrupt('properties_json');
  let properties: unknown;
  try {
    properties = JSON.parse(row.properties_json);
  } catch {
    return corrupt('properties_json');
  }
  if (!validateAnalyticsProperties(properties)) return corrupt('properties_json');
  if (!isSafeTimestamp(row.occurred_at)) return corrupt('occurred_at');
  if (
    !isSafeTimestamp(row.expires_at) ||
    row.expires_at !== row.occurred_at + 604_800_000
  ) return corrupt('expires_at');
  if (row.delivery_state !== 'pending' && row.delivery_state !== 'retry_wait') {
    return corrupt('delivery_state');
  }
  if (!isNonNegativeSafeInteger(row.attempt_count)) return corrupt('attempt_count');
  if (row.next_attempt_at !== null && !isSafeTimestamp(row.next_attempt_at)) {
    return corrupt('next_attempt_at');
  }
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  return mapped({
    eventId: row.event_id,
    eventName: row.event_name,
    properties: Object.freeze({ ...properties }),
    occurredAt: row.occurred_at,
    expiresAt: row.expires_at,
    deliveryState: row.delivery_state,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    createdAt: row.created_at,
  });
};
