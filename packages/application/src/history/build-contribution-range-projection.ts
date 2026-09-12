import type { ContributionDayFact } from '../persistence/derived-query';
import type { ApplicationResult } from '../result/application-result';

export const CONTRIBUTION_RANGE_DAYS = 7;

export type ContributionIntensityBand =
  | 'zero'
  | 'low'
  | 'medium'
  | 'high'
  | 'peak';

export interface DailyContributionProjection {
  readonly localDate: string;
  readonly completedMinutes: number;
  readonly completedSessionCount: number;
  readonly intensity: ContributionIntensityBand;
}

export interface ContributionRangeProjection {
  readonly startLocalDate: string;
  readonly endLocalDate: string;
  readonly days: readonly DailyContributionProjection[];
}

export interface ContributionProjectionError {
  readonly kind: 'contribution_projection_error';
  readonly code: 'CONTRIBUTION_DATA_INVALID';
}

export interface BuildContributionRangeInput {
  readonly endLocalDate: string;
  readonly facts: readonly ContributionDayFact[];
}

const invalid = (): ApplicationResult<never, ContributionProjectionError> => ({
  ok: false,
  error: {
    kind: 'contribution_projection_error',
    code: 'CONTRIBUTION_DATA_INVALID',
  },
});

const parseLocalDate = (value: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9_999 || month < 1 || month > 12 || day < 1) return undefined;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return undefined;
  return date;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${month}-${day}`;
};

const buildDates = (endLocalDate: string): readonly string[] | undefined => {
  const end = parseLocalDate(endLocalDate);
  if (end === undefined) return undefined;
  const dates: string[] = [];
  for (let offset = CONTRIBUTION_RANGE_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(end.getTime());
    date.setUTCDate(date.getUTCDate() - offset);
    if (date.getUTCFullYear() < 1) return undefined;
    dates.push(formatLocalDate(date));
  }
  return Object.freeze(dates);
};

const isValidFact = (fact: ContributionDayFact): boolean => {
  if (parseLocalDate(fact.scheduledEndLocalDate) === undefined) return false;
  const { completedSessionCount: count, totalCompletedMinutes: minutes } = fact;
  return Number.isSafeInteger(count) && count > 0 &&
    Number.isSafeInteger(minutes) && minutes > 0 && minutes % 5 === 0 &&
    Number.isSafeInteger(count * 120) &&
    minutes >= count * 15 && minutes <= count * 120;
};

export const contributionIntensityFor = (
  completedMinutes: number,
): ContributionIntensityBand | undefined => {
  if (!Number.isSafeInteger(completedMinutes) || completedMinutes < 0) return undefined;
  if (completedMinutes === 0) return 'zero';
  if (completedMinutes < 25) return 'low';
  if (completedMinutes < 50) return 'medium';
  if (completedMinutes < 100) return 'high';
  return 'peak';
};

export const buildContributionRangeProjection = (
  input: BuildContributionRangeInput,
): ApplicationResult<ContributionRangeProjection, ContributionProjectionError> => {
  const dates = buildDates(input.endLocalDate);
  if (dates === undefined) return invalid();
  const startLocalDate = dates[0];
  if (startLocalDate === undefined) return invalid();

  const factsByDate = new Map<string, ContributionDayFact>();
  let previousDate: string | undefined;
  for (const fact of input.facts) {
    if (
      !isValidFact(fact) ||
      fact.scheduledEndLocalDate < startLocalDate ||
      fact.scheduledEndLocalDate > input.endLocalDate ||
      (previousDate !== undefined && previousDate >= fact.scheduledEndLocalDate)
    ) return invalid();
    previousDate = fact.scheduledEndLocalDate;
    factsByDate.set(fact.scheduledEndLocalDate, fact);
  }

  const days = dates.map((localDate): DailyContributionProjection => {
    const fact = factsByDate.get(localDate);
    const completedMinutes = fact?.totalCompletedMinutes ?? 0;
    const intensity = contributionIntensityFor(completedMinutes);
    if (intensity === undefined) throw new Error('validated contribution produced invalid intensity');
    return Object.freeze({
      localDate,
      completedMinutes,
      completedSessionCount: fact?.completedSessionCount ?? 0,
      intensity,
    });
  });
  Object.freeze(days);
  return {
    ok: true,
    value: Object.freeze({
      startLocalDate,
      endLocalDate: input.endLocalDate,
      days,
    }),
  };
};
