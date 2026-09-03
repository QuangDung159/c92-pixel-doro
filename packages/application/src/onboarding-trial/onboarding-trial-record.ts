import type {
  RunningSessionRecord,
  SessionRecord,
} from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';

export const ONBOARDING_TRIAL_DURATION_MINUTES = 5;
export const ONBOARDING_TRIAL_DURATION_MS = 300_000;
export const MVP_PROFILE_ID = 1;

const MAX_TIMESTAMP = 8_640_000_000_000_000;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidLocalDate = (value: string): boolean => {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
};

export interface OnboardingTrialRecordInput {
  readonly id: string;
  readonly startedAt: number;
  readonly scheduledEndLocalDate: string;
  readonly scheduledEndUtcOffsetMinutes: number;
}

export interface OnboardingTrialRecordError {
  readonly kind: 'onboarding_trial_record_error';
  readonly code: 'ONBOARDING_TRIAL_RECORD_INVALID';
}

const invalidRecord = (): ApplicationResult<never, OnboardingTrialRecordError> => ({
  ok: false,
  error: {
    kind: 'onboarding_trial_record_error',
    code: 'ONBOARDING_TRIAL_RECORD_INVALID',
  },
});

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

export const createOnboardingTrialRecord = (
  input: OnboardingTrialRecordInput,
): ApplicationResult<RunningSessionRecord, OnboardingTrialRecordError> => {
  const endsAt = input.startedAt + ONBOARDING_TRIAL_DURATION_MS;
  if (
    input.id.length === 0 ||
    !isSafeTimestamp(input.startedAt) ||
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
      focusVariant: 'onboarding_trial',
      mode: 'relax',
      status: 'running',
      workTag: null,
      configuredDurationMinutes: ONBOARDING_TRIAL_DURATION_MINUTES,
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

export const isRunningOnboardingTrial = (
  record: SessionRecord,
): record is RunningSessionRecord =>
  record.status === 'running' &&
  record.resolvedAt === null &&
  record.xpEarned === 0 &&
  record.coinsEarned === 0 &&
  record.rewardClaimedAt === null &&
  record.sessionType === 'focus' &&
  record.focusVariant === 'onboarding_trial' &&
  record.mode === 'relax' &&
  record.workTag === null &&
  record.configuredDurationMinutes === ONBOARDING_TRIAL_DURATION_MINUTES &&
  record.backgroundedAt === null;
