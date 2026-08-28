import type {
  FocusMode,
  FocusVariant,
  SessionRecord,
  SessionStatus,
  SessionType,
  WorkTag,
} from '@pixeldoro/application';

import {
  corrupt,
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isNullableTimestamp,
  isSafeTimestamp,
  mapped,
  type RowMapping,
} from './row-mapping';

export interface SessionRow {
  readonly id: unknown;
  readonly profile_id: unknown;
  readonly session_type: unknown;
  readonly focus_variant: unknown;
  readonly mode: unknown;
  readonly status: unknown;
  readonly work_tag: unknown;
  readonly configured_duration_minutes: unknown;
  readonly started_at: unknown;
  readonly ends_at: unknown;
  readonly backgrounded_at: unknown;
  readonly resolved_at: unknown;
  readonly xp_earned: unknown;
  readonly coins_earned: unknown;
  readonly reward_claimed_at: unknown;
  readonly scheduled_end_local_date: unknown;
  readonly scheduled_end_utc_offset_minutes: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
}

const sessionTypes: readonly SessionType[] = ['focus', 'short_break', 'long_break'];
const focusVariants: readonly FocusVariant[] = ['standard', 'onboarding_trial'];
const modes: readonly FocusMode[] = ['relax', 'strict'];
const statuses: readonly SessionStatus[] = ['running', 'completed', 'failed', 'cancelled'];
const workTags: readonly WorkTag[] = ['coding', 'study', 'writing', 'reading'];
const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const includes = <TValue extends string>(
  values: readonly TValue[],
  value: unknown,
): value is TValue => typeof value === 'string' && values.includes(value as TValue);

const hasValidIdentityShape = (row: SessionRow): boolean => {
  if (row.session_type === 'focus' && row.focus_variant === 'standard') {
    return (
      includes(modes, row.mode) &&
      includes(workTags, row.work_tag) &&
      typeof row.configured_duration_minutes === 'number' &&
      Number.isSafeInteger(row.configured_duration_minutes) &&
      row.configured_duration_minutes >= 15 &&
      row.configured_duration_minutes <= 120 &&
      row.configured_duration_minutes % 5 === 0 &&
      (row.backgrounded_at === null || row.mode === 'strict')
    );
  }

  if (row.session_type === 'focus' && row.focus_variant === 'onboarding_trial') {
    return (
      row.mode === 'relax' &&
      row.work_tag === null &&
      row.backgrounded_at === null &&
      row.configured_duration_minutes === 5 &&
      row.status !== 'failed'
    );
  }

  if (row.session_type === 'short_break' || row.session_type === 'long_break') {
    return (
      row.focus_variant === null &&
      row.mode === null &&
      row.work_tag === null &&
      row.backgrounded_at === null &&
      row.configured_duration_minutes ===
        (row.session_type === 'short_break' ? 5 : 15) &&
      row.status !== 'failed'
    );
  }

  return false;
};

const hasValidResolutionShape = (row: SessionRow): boolean => {
  if (row.status === 'running') {
    return row.resolved_at === null && row.xp_earned === 0 &&
      row.coins_earned === 0 && row.reward_claimed_at === null;
  }
  if (row.status === 'failed' || row.status === 'cancelled') {
    return isSafeTimestamp(row.resolved_at) && row.xp_earned === 0 &&
      row.coins_earned === 0 && row.reward_claimed_at === null;
  }
  if (row.status === 'completed' && row.session_type !== 'focus') {
    return isSafeTimestamp(row.resolved_at) && row.xp_earned === 0 &&
      row.coins_earned === 0 && row.reward_claimed_at === null;
  }
  return row.status === 'completed' && row.session_type === 'focus' &&
    isSafeTimestamp(row.resolved_at) &&
    row.xp_earned === row.configured_duration_minutes &&
    row.coins_earned === Number(row.configured_duration_minutes) / 5 &&
    isSafeTimestamp(row.reward_claimed_at);
};

export const mapSessionRow = (row: SessionRow): RowMapping<SessionRecord> => {
  if (!isNonEmptyString(row.id)) return corrupt('id');
  if (row.profile_id !== 1) return corrupt('profile_id');
  if (!includes(sessionTypes, row.session_type)) return corrupt('session_type');
  if (row.focus_variant !== null && !includes(focusVariants, row.focus_variant)) {
    return corrupt('focus_variant');
  }
  if (row.mode !== null && !includes(modes, row.mode)) return corrupt('mode');
  if (!includes(statuses, row.status)) return corrupt('status');
  if (row.work_tag !== null && !includes(workTags, row.work_tag)) return corrupt('work_tag');
  if (!isSafeTimestamp(row.started_at)) return corrupt('started_at');
  if (!isSafeTimestamp(row.ends_at)) return corrupt('ends_at');
  if (!isNullableTimestamp(row.backgrounded_at)) return corrupt('backgrounded_at');
  if (!isNullableTimestamp(row.resolved_at)) return corrupt('resolved_at');
  if (!isNonNegativeSafeInteger(row.xp_earned)) return corrupt('xp_earned');
  if (!isNonNegativeSafeInteger(row.coins_earned)) return corrupt('coins_earned');
  if (!isNullableTimestamp(row.reward_claimed_at)) return corrupt('reward_claimed_at');
  if (
    typeof row.scheduled_end_local_date !== 'string' ||
    !localDatePattern.test(row.scheduled_end_local_date)
  ) return corrupt('scheduled_end_local_date');
  if (
    typeof row.scheduled_end_utc_offset_minutes !== 'number' ||
    !Number.isSafeInteger(row.scheduled_end_utc_offset_minutes) ||
    row.scheduled_end_utc_offset_minutes < -840 ||
    row.scheduled_end_utc_offset_minutes > 840
  ) return corrupt('scheduled_end_utc_offset_minutes');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');
  if (
    typeof row.configured_duration_minutes !== 'number' ||
    !Number.isSafeInteger(row.configured_duration_minutes) ||
    row.ends_at !== row.started_at + row.configured_duration_minutes * 60_000
  ) return corrupt('configured_duration_minutes');
  if (!hasValidIdentityShape(row)) return corrupt('conditional_identity_shape');
  if (!hasValidResolutionShape(row)) return corrupt('conditional_resolution_shape');

  return mapped({
    id: row.id,
    profileId: 1,
    sessionType: row.session_type,
    focusVariant: row.focus_variant,
    mode: row.mode,
    status: row.status,
    workTag: row.work_tag,
    configuredDurationMinutes: row.configured_duration_minutes,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    backgroundedAt: row.backgrounded_at,
    resolvedAt: row.resolved_at,
    xpEarned: row.xp_earned,
    coinsEarned: row.coins_earned,
    rewardClaimedAt: row.reward_claimed_at,
    scheduledEndLocalDate: row.scheduled_end_local_date,
    scheduledEndUtcOffsetMinutes: row.scheduled_end_utc_offset_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};
