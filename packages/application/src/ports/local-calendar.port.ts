import type { ApplicationResult } from '../result/application-result';

export interface LocalCalendarSnapshot {
  readonly localDate: string;
  readonly utcOffsetMinutes: number;
}

export interface LocalCalendarError {
  readonly kind: 'local_calendar_error';
  readonly code: 'LOCAL_CALENDAR_INVALID_TIMESTAMP' | 'LOCAL_CALENDAR_SNAPSHOT_FAILED';
}

export interface LocalCalendarPort {
  snapshot(
    atMs: number,
  ): ApplicationResult<LocalCalendarSnapshot, LocalCalendarError>;
}
