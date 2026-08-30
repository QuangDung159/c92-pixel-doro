import type {
  ApprovedAnalyticsEventName,
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

const approvedEventNames: readonly ApprovedAnalyticsEventName[] = [
  'onboarding_started',
  'onboarding_completed',
  'focus_setup_viewed',
  'focus_session_started',
  'focus_session_completed',
  'focus_session_failed',
  'focus_session_cancelled',
  'break_started',
  'break_completed',
  'reward_granted',
  'shop_viewed',
  'item_unlocked',
  'item_equipped',
  'history_viewed',
  'feedback_started',
  'feedback_submitted',
  'store_review_requested',
];

const approvedItemIds = new Set([
  'desk-mug', 'tiny-plant', 'book-stack', 'desk-lamp', 'wall-calendar',
  'floor-cushion', 'small-rug', 'wall-poster', 'bookshelf', 'standing-lamp',
  'armchair', 'window-view',
]);

const isOneOf = (value: unknown, values: readonly string[]): value is string =>
  typeof value === 'string' && values.includes(value);

const isApprovedProperty = (key: string, value: unknown): boolean => {
  switch (key) {
    case 'sessionType':
      return isOneOf(value, ['focus', 'short_break', 'long_break']);
    case 'focusVariant':
      return value === null || isOneOf(value, ['standard', 'onboarding_trial']);
    case 'mode':
      return value === null || isOneOf(value, ['relax', 'strict']);
    case 'workTag':
      return value === null || isOneOf(value, ['coding', 'study', 'writing', 'reading']);
    case 'status':
      return isOneOf(value, ['running', 'completed', 'failed', 'cancelled']);
    case 'breakType':
      return isOneOf(value, ['short_break', 'long_break']);
    case 'rewardReason':
      return isOneOf(value, ['focus_completed', 'onboarding_trial_completed']);
    case 'category':
      return value === 'furniture';
    case 'itemId':
      return typeof value === 'string' && approvedItemIds.has(value);
    case 'configuredDurationMinutes':
    case 'durationMinutes':
      return typeof value === 'number' && Number.isSafeInteger(value) &&
        value >= 5 && value <= 120;
    case 'attemptCount':
      return isNonNegativeSafeInteger(value);
    case 'isFirstSession':
    case 'isSecondSession':
    case 'isReturningUser':
      return typeof value === 'boolean';
    default:
      return false;
  }
};

export const isApprovedAnalyticsEventName = (
  value: unknown,
): value is ApprovedAnalyticsEventName =>
  typeof value === 'string' &&
  approvedEventNames.includes(value as ApprovedAnalyticsEventName);

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
    entries.every(([key, property]) => isApprovedProperty(key, property));
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
  if (!isApprovedAnalyticsEventName(row.event_name)) return corrupt('event_name');
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
  if (
    (row.delivery_state === 'pending' &&
      (row.attempt_count !== 0 || row.next_attempt_at !== null)) ||
    (row.delivery_state === 'retry_wait' &&
      (row.attempt_count === 0 || !isSafeTimestamp(row.next_attempt_at)))
  ) return corrupt('delivery_shape');
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
