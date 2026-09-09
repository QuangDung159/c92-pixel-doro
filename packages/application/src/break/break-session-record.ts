import {
  validateBreakConfiguration,
  type BreakRecommendation,
} from '@pixeldoro/domain';

import { MVP_PROFILE_ID } from '../onboarding-trial/onboarding-trial-record';
import type { RunningSessionRecord, SessionRecord } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isSafeSessionTimestamp } from './break-source';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface BreakSessionRecordInput {
  readonly id: string;
  readonly recommendation: BreakRecommendation;
  readonly startedAt: number;
  readonly scheduledEndLocalDate: string;
  readonly scheduledEndUtcOffsetMinutes: number;
}

export interface BreakSessionRecordError {
  readonly kind: 'break_session_record_error';
  readonly code: 'BREAK_SESSION_RECORD_INVALID';
}

const invalid = (): ApplicationResult<never, BreakSessionRecordError> => ({
  ok: false,
  error: { kind: 'break_session_record_error', code: 'BREAK_SESSION_RECORD_INVALID' },
});

const isValidLocalDate = (value: string): boolean => {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
};

export const createBreakSessionRecord = (
  input: BreakSessionRecordInput,
): ApplicationResult<RunningSessionRecord, BreakSessionRecordError> => {
  const configuration = validateBreakConfiguration(input.recommendation);
  const endsAt = input.startedAt + input.recommendation.durationMinutes * 60_000;
  if (
    !configuration.ok ||
    configuration.value.kind !== input.recommendation.kind ||
    input.id.trim().length === 0 ||
    !isSafeSessionTimestamp(input.startedAt) ||
    !isSafeSessionTimestamp(endsAt) ||
    !isValidLocalDate(input.scheduledEndLocalDate) ||
    !Number.isInteger(input.scheduledEndUtcOffsetMinutes) ||
    input.scheduledEndUtcOffsetMinutes < -840 ||
    input.scheduledEndUtcOffsetMinutes > 840
  ) return invalid();

  return {
    ok: true,
    value: Object.freeze({
      id: input.id,
      profileId: MVP_PROFILE_ID,
      sessionType: configuration.value.sessionType,
      focusVariant: null,
      mode: null,
      status: 'running',
      workTag: null,
      configuredDurationMinutes: configuration.value.durationMinutes,
      startedAt: input.startedAt,
      endsAt,
      backgroundedAt: null,
      resolvedAt: null,
      xpEarned: 0,
      coinsEarned: 0,
      rewardClaimedAt: null,
      scheduledEndLocalDate: input.scheduledEndLocalDate,
      scheduledEndUtcOffsetMinutes: input.scheduledEndUtcOffsetMinutes,
      createdAt: input.startedAt,
      updatedAt: input.startedAt,
    }),
  };
};

export const isRunningBreak = (
  record: SessionRecord,
): record is RunningSessionRecord & {
  readonly sessionType: 'short_break' | 'long_break';
} => record.status === 'running' &&
  record.focusVariant === null &&
  record.mode === null &&
  record.workTag === null &&
  record.backgroundedAt === null &&
  record.resolvedAt === null &&
  record.xpEarned === 0 &&
  record.coinsEarned === 0 &&
  record.rewardClaimedAt === null &&
  validateBreakConfiguration({
    sessionType: record.sessionType as 'short_break' | 'long_break',
    durationMinutes: record.configuredDurationMinutes,
  }).ok &&
  isSafeSessionTimestamp(record.startedAt) &&
  isSafeSessionTimestamp(record.endsAt) &&
  record.endsAt === record.startedAt + record.configuredDurationMinutes * 60_000 &&
  record.createdAt === record.startedAt &&
  record.updatedAt === record.startedAt;

const hasBreakIdentity = (record: SessionRecord): boolean =>
  record.focusVariant === null &&
  record.mode === null &&
  record.workTag === null &&
  record.backgroundedAt === null &&
  record.xpEarned === 0 &&
  record.coinsEarned === 0 &&
  record.rewardClaimedAt === null &&
  validateBreakConfiguration({
    sessionType: record.sessionType as 'short_break' | 'long_break',
    durationMinutes: record.configuredDurationMinutes,
  }).ok &&
  isSafeSessionTimestamp(record.startedAt) &&
  isSafeSessionTimestamp(record.endsAt) &&
  record.endsAt === record.startedAt + record.configuredDurationMinutes * 60_000 &&
  record.createdAt === record.startedAt;

export const isCompletedBreak = (record: SessionRecord): boolean =>
  record.status === 'completed' &&
  hasBreakIdentity(record) &&
  record.resolvedAt !== null &&
  isSafeSessionTimestamp(record.resolvedAt) &&
  record.resolvedAt >= record.endsAt &&
  record.updatedAt === record.resolvedAt;

export const isCancelledBreak = (record: SessionRecord): boolean =>
  record.status === 'cancelled' &&
  hasBreakIdentity(record) &&
  record.resolvedAt !== null &&
  isSafeSessionTimestamp(record.resolvedAt) &&
  record.resolvedAt >= record.startedAt &&
  record.updatedAt === record.resolvedAt;
