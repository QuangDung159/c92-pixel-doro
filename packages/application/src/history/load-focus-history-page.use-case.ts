import { MVP_PROFILE_ID } from '../onboarding-trial/onboarding-trial-record';
import type {
  StandardFocusHistoryCursor,
  StandardFocusHistoryEntry,
  StandardFocusHistoryQuery,
} from '../persistence/derived-query';
import type { PersistenceError } from '../persistence/persistence.error';
import type { ApplicationResult } from '../result/application-result';

export const FOCUS_HISTORY_PAGE_SIZE = 20;

const MAX_TIMESTAMP = 8_640_000_000_000_000;
const statuses = new Set(['completed', 'failed', 'cancelled']);
const modes = new Set(['relax', 'strict']);
const workTags = new Set(['coding', 'study', 'writing', 'reading']);

export interface FocusHistoryItemProjection {
  readonly id: string;
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly workTag: 'coding' | 'study' | 'writing' | 'reading';
  readonly configuredDurationMinutes: number;
  readonly endsAt: number;
  readonly scheduledEndLocalDate: string;
}

export interface FocusHistoryFirstPageProjection {
  readonly items: readonly FocusHistoryItemProjection[];
  readonly nextCursor: StandardFocusHistoryCursor | null;
}

export type LoadFocusHistoryPageErrorCode =
  | 'HISTORY_READ_FAILED'
  | 'HISTORY_DATA_INVALID';

export interface LoadFocusHistoryPageError {
  readonly kind: 'load_focus_history_page_error';
  readonly code: LoadFocusHistoryPageErrorCode;
}

export interface LoadFocusHistoryPageDependencies {
  readonly history: StandardFocusHistoryQuery;
}

const failure = (
  code: LoadFocusHistoryPageErrorCode,
): ApplicationResult<never, LoadFocusHistoryPageError> => ({
  ok: false,
  error: { kind: 'load_focus_history_page_error', code },
});

const errorCodeFor = (error: PersistenceError): LoadFocusHistoryPageErrorCode =>
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
    ? 'HISTORY_DATA_INVALID'
    : 'HISTORY_READ_FAILED';

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

const isCanonicalLocalDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
};

const isValidEntry = (entry: StandardFocusHistoryEntry): boolean =>
  typeof entry.id === 'string' && entry.id.trim().length > 0 &&
  statuses.has(entry.status) && modes.has(entry.mode) && workTags.has(entry.workTag) &&
  Number.isSafeInteger(entry.configuredDurationMinutes) &&
  entry.configuredDurationMinutes >= 15 && entry.configuredDurationMinutes <= 120 &&
  entry.configuredDurationMinutes % 5 === 0 &&
  isSafeTimestamp(entry.startedAt) && isSafeTimestamp(entry.endsAt) &&
  entry.endsAt === entry.startedAt + entry.configuredDurationMinutes * 60_000 &&
  isSafeTimestamp(entry.resolvedAt) &&
  isCanonicalLocalDate(entry.scheduledEndLocalDate) &&
  Number.isSafeInteger(entry.scheduledEndUtcOffsetMinutes) &&
  entry.scheduledEndUtcOffsetMinutes >= -840 &&
  entry.scheduledEndUtcOffsetMinutes <= 840;

const isOrderedAfter = (
  previous: StandardFocusHistoryEntry,
  current: StandardFocusHistoryEntry,
): boolean => previous.endsAt > current.endsAt ||
  (previous.endsAt === current.endsAt && previous.id < current.id);

const isValidPage = (
  entries: readonly StandardFocusHistoryEntry[],
  nextCursor: StandardFocusHistoryCursor | null,
): boolean => {
  if (entries.length > FOCUS_HISTORY_PAGE_SIZE) return false;
  const identities = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (!isValidEntry(entry) || identities.has(entry.id)) return false;
    identities.add(entry.id);
    const previous = entries[index - 1];
    if (previous !== undefined && !isOrderedAfter(previous, entry)) return false;
  }
  if (nextCursor === null) return true;
  const last = entries.at(-1);
  return entries.length === FOCUS_HISTORY_PAGE_SIZE && last !== undefined &&
    isSafeTimestamp(nextCursor.endsAt) &&
    typeof nextCursor.id === 'string' && nextCursor.id.trim().length > 0 &&
    nextCursor.endsAt === last.endsAt && nextCursor.id === last.id;
};

const freezeProjection = (
  entries: readonly StandardFocusHistoryEntry[],
  nextCursor: StandardFocusHistoryCursor | null,
): FocusHistoryFirstPageProjection => {
  const items = entries.map((entry): FocusHistoryItemProjection => Object.freeze({
    id: entry.id,
    status: entry.status,
    workTag: entry.workTag,
    configuredDurationMinutes: entry.configuredDurationMinutes,
    endsAt: entry.endsAt,
    scheduledEndLocalDate: entry.scheduledEndLocalDate,
  }));
  Object.freeze(items);
  return Object.freeze({
    items,
    nextCursor: nextCursor === null ? null : Object.freeze({ ...nextCursor }),
  });
};

export class LoadFocusHistoryPageUseCase {
  constructor(private readonly dependencies: LoadFocusHistoryPageDependencies) {}

  async execute(): Promise<
    ApplicationResult<FocusHistoryFirstPageProjection, LoadFocusHistoryPageError>
  > {
    try {
      const result = await this.dependencies.history.list({
        profileId: MVP_PROFILE_ID,
        limit: FOCUS_HISTORY_PAGE_SIZE,
        cursor: null,
      });
      if (!result.ok) return failure(errorCodeFor(result.error));
      if (!isValidPage(result.value.entries, result.value.nextCursor)) {
        return failure('HISTORY_DATA_INVALID');
      }
      return {
        ok: true,
        value: freezeProjection(result.value.entries, result.value.nextCursor),
      };
    } catch {
      return failure('HISTORY_READ_FAILED');
    }
  }
}
