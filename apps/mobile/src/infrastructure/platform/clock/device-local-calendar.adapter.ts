import type {
  ApplicationResult,
  LocalCalendarError,
  LocalCalendarPort,
  LocalCalendarSnapshot,
} from '@pixeldoro/application';

const failure = (
  code: LocalCalendarError['code'],
): ApplicationResult<never, LocalCalendarError> => ({
  ok: false,
  error: { kind: 'local_calendar_error', code },
});

const pad2 = (value: number): string => String(value).padStart(2, '0');

export class DeviceLocalCalendarAdapter implements LocalCalendarPort {
  snapshot(
    atMs: number,
  ): ApplicationResult<LocalCalendarSnapshot, LocalCalendarError> {
    if (!Number.isSafeInteger(atMs) || atMs < 0) {
      return failure('LOCAL_CALENDAR_INVALID_TIMESTAMP');
    }
    try {
      const date = new Date(atMs);
      const year = date.getFullYear();
      const offset = -date.getTimezoneOffset();
      if (
        Number.isNaN(date.getTime()) ||
        year < 0 ||
        year > 9_999 ||
        !Number.isInteger(offset) ||
        offset < -840 ||
        offset > 840
      ) {
        return failure('LOCAL_CALENDAR_SNAPSHOT_FAILED');
      }
      return {
        ok: true,
        value: {
          localDate: `${String(year).padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
          utcOffsetMinutes: offset,
        },
      };
    } catch {
      return failure('LOCAL_CALENDAR_SNAPSHOT_FAILED');
    }
  }
}
