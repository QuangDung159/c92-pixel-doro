import { describe, expect, it } from 'vitest';

import { DeviceLocalCalendarAdapter } from './device-local-calendar.adapter';

describe('DeviceLocalCalendarAdapter', () => {
  it('captures a valid local date and UTC offset', () => {
    const result = new DeviceLocalCalendarAdapter().snapshot(Date.UTC(2026, 7, 31, 8));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isInteger(result.value.utcOffsetMinutes)).toBe(true);
    expect(result.value.utcOffsetMinutes).toBeGreaterThanOrEqual(-840);
    expect(result.value.utcOffsetMinutes).toBeLessThanOrEqual(840);
  });

  it('rejects an invalid timestamp', () => {
    expect(new DeviceLocalCalendarAdapter().snapshot(-1)).toEqual({
      ok: false,
      error: {
        kind: 'local_calendar_error',
        code: 'LOCAL_CALENDAR_INVALID_TIMESTAMP',
      },
    });
  });
});
