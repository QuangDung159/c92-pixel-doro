import { describe, expect, it } from 'vitest';

import { validateBreakConfiguration } from './break-configuration';

describe('validateBreakConfiguration', () => {
  it.each([
    ['short_break', 5, 'short'],
    ['long_break', 15, 'long'],
  ] as const)('accepts %s/%s', (sessionType, durationMinutes, kind) => {
    expect(validateBreakConfiguration({ sessionType, durationMinutes })).toEqual({
      ok: true,
      value: { kind, sessionType, durationMinutes },
    });
  });

  it.each([
    ['short_break', 15],
    ['long_break', 5],
    ['short_break', 0],
    ['long_break', Number.NaN],
  ] as const)('rejects %s/%s', (sessionType, durationMinutes) => {
    expect(validateBreakConfiguration({ sessionType, durationMinutes })).toEqual({
      ok: false,
      error: { code: 'BREAK_CONFIGURATION_INVALID' },
    });
  });
});
