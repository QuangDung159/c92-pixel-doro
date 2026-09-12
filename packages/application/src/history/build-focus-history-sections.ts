import type { ApplicationResult } from '../result/application-result';
import type {
  FocusHistoryItemProjection,
  LoadFocusHistoryPageError,
} from './load-focus-history-page.use-case';

export interface FocusHistoryDateSection {
  readonly localDate: string;
  readonly completedMinutes: number;
  readonly items: readonly FocusHistoryItemProjection[];
}

const invalid = (): ApplicationResult<never, LoadFocusHistoryPageError> => ({
  ok: false,
  error: {
    kind: 'load_focus_history_page_error',
    code: 'HISTORY_DATA_INVALID',
  },
});

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

const isValidItem = (item: FocusHistoryItemProjection): boolean =>
  typeof item.id === 'string' && item.id.trim().length > 0 &&
  (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') &&
  (item.workTag === 'coding' || item.workTag === 'study' ||
    item.workTag === 'writing' || item.workTag === 'reading') &&
  Number.isSafeInteger(item.configuredDurationMinutes) &&
  item.configuredDurationMinutes >= 15 && item.configuredDurationMinutes <= 120 &&
  item.configuredDurationMinutes % 5 === 0 &&
  Number.isSafeInteger(item.endsAt) && item.endsAt >= 0 &&
  isCanonicalLocalDate(item.scheduledEndLocalDate);

const isOrderedAfter = (
  previous: FocusHistoryItemProjection,
  current: FocusHistoryItemProjection,
): boolean => previous.endsAt > current.endsAt ||
  (previous.endsAt === current.endsAt && previous.id < current.id);

export const buildFocusHistorySections = (
  items: readonly FocusHistoryItemProjection[],
): ApplicationResult<readonly FocusHistoryDateSection[], LoadFocusHistoryPageError> => {
  const ids = new Set<string>();
  const groups = new Map<string, {
    completedMinutes: number;
    items: FocusHistoryItemProjection[];
  }>();

  for (const [index, item] of items.entries()) {
    const previous = items[index - 1];
    if (
      !isValidItem(item) || ids.has(item.id) ||
      (previous !== undefined && !isOrderedAfter(previous, item))
    ) return invalid();
    ids.add(item.id);
    const group = groups.get(item.scheduledEndLocalDate) ?? {
      completedMinutes: 0,
      items: [],
    };
    if (item.status === 'completed') {
      const total = group.completedMinutes + item.configuredDurationMinutes;
      if (!Number.isSafeInteger(total)) return invalid();
      group.completedMinutes = total;
    }
    group.items.push(item);
    groups.set(item.scheduledEndLocalDate, group);
  }

  const sections = [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([localDate, group]): FocusHistoryDateSection => Object.freeze({
      localDate,
      completedMinutes: group.completedMinutes,
      items: Object.freeze([...group.items]),
    }));
  return { ok: true, value: Object.freeze(sections) };
};
