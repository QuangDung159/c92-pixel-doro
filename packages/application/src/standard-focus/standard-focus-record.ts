import {
  validateStandardFocusConfiguration,
  type StandardFocusConfiguration,
} from '@pixeldoro/domain';

import type {
  RunningSessionRecord,
  SessionRecord,
} from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { MVP_PROFILE_ID } from '../onboarding-trial/onboarding-trial-record';

const MAX_TIMESTAMP = 8_640_000_000_000_000;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface StandardFocusRecordInput {
  readonly id: string;
  readonly configuration: StandardFocusConfiguration;
  readonly startedAt: number;
  readonly scheduledEndLocalDate: string;
  readonly scheduledEndUtcOffsetMinutes: number;
}

export interface StandardFocusRecordError {
  readonly kind: 'standard_focus_record_error';
  readonly code: 'STANDARD_FOCUS_RECORD_INVALID';
}

const invalidRecord = (): ApplicationResult<never, StandardFocusRecordError> => ({
  ok: false,
  error: {
    kind: 'standard_focus_record_error',
    code: 'STANDARD_FOCUS_RECORD_INVALID',
  },
});

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

const isValidLocalDate = (value: string): boolean => {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
};

export const createStandardFocusRecord = (
  input: StandardFocusRecordInput,
): ApplicationResult<RunningSessionRecord, StandardFocusRecordError> => {
  const configuration = validateStandardFocusConfiguration(input.configuration);
  const durationMs = input.configuration.durationMinutes * 60_000;
  const endsAt = input.startedAt + durationMs;
  if (
    !configuration.ok ||
    input.id.trim().length === 0 ||
    !isSafeTimestamp(input.startedAt) ||
    !Number.isSafeInteger(durationMs) ||
    !isSafeTimestamp(endsAt) ||
    !isValidLocalDate(input.scheduledEndLocalDate) ||
    !Number.isInteger(input.scheduledEndUtcOffsetMinutes) ||
    input.scheduledEndUtcOffsetMinutes < -840 ||
    input.scheduledEndUtcOffsetMinutes > 840
  ) {
    return invalidRecord();
  }

  return {
    ok: true,
    value: Object.freeze({
      id: input.id,
      profileId: MVP_PROFILE_ID,
      sessionType: 'focus',
      focusVariant: 'standard',
      mode: configuration.value.mode,
      status: 'running',
      workTag: configuration.value.workTag,
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

export const isRunningStandardFocus = (
  record: SessionRecord,
): record is RunningSessionRecord & {
  readonly focusVariant: 'standard';
  readonly mode: NonNullable<RunningSessionRecord['mode']>;
  readonly workTag: NonNullable<RunningSessionRecord['workTag']>;
} => {
  if (
    record.sessionType !== 'focus' ||
    record.focusVariant !== 'standard' ||
    record.status !== 'running' ||
    record.mode === null ||
    record.workTag === null ||
    record.resolvedAt !== null ||
    record.xpEarned !== 0 ||
    record.coinsEarned !== 0 ||
    record.rewardClaimedAt !== null
  ) {
    return false;
  }
  return validateStandardFocusConfiguration({
    durationMinutes: record.configuredDurationMinutes,
    mode: record.mode,
    workTag: record.workTag,
  }).ok;
};
