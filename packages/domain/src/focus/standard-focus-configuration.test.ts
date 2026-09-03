import { describe, expect, it } from 'vitest';

import {
  STANDARD_FOCUS_MAX_DURATION_MINUTES,
  STANDARD_FOCUS_MIN_DURATION_MINUTES,
  validateStandardFocusConfiguration,
} from './standard-focus-configuration';

const decide = (
  durationMinutes: unknown,
  mode: unknown = 'relax',
  workTag: unknown = 'coding',
) => validateStandardFocusConfiguration({ durationMinutes, mode, workTag });

describe('validateStandardFocusConfiguration', () => {
  it.each([15, 20, 25, 50, 115, 120])(
    'accepts approved duration %i',
    (durationMinutes) => {
      expect(decide(durationMinutes)).toEqual({
        ok: true,
        value: { durationMinutes, mode: 'relax', workTag: 'coding' },
      });
    },
  );

  it.each([14, 17, 121, 25.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects malformed duration %s instead of clamping',
    (durationMinutes) => {
      expect(decide(durationMinutes)).toEqual({
        ok: false,
        error: { code: 'DURATION_INVALID' },
      });
    },
  );

  it.each(['relax', 'strict'])('accepts mode %s', (mode) => {
    expect(decide(25, mode)).toMatchObject({ ok: true, value: { mode } });
  });

  it.each(['coding', 'study', 'writing', 'reading'])(
    'accepts work tag %s',
    (workTag) => {
      expect(decide(25, 'relax', workTag)).toMatchObject({
        ok: true,
        value: { workTag },
      });
    },
  );

  it('rejects unknown mode and work tag with stable errors', () => {
    expect(decide(25, 'deep')).toEqual({
      ok: false,
      error: { code: 'MODE_INVALID' },
    });
    expect(decide(25, 'relax', 'custom')).toEqual({
      ok: false,
      error: { code: 'WORK_TAG_INVALID' },
    });
  });

  it('returns an immutable value without mutating input', () => {
    const input = {
      durationMinutes: STANDARD_FOCUS_MIN_DURATION_MINUTES,
      mode: 'strict',
      workTag: 'study',
    };
    const result = validateStandardFocusConfiguration(input);

    expect(result.ok && Object.isFrozen(result.value)).toBe(true);
    expect(input).toEqual({ durationMinutes: 15, mode: 'strict', workTag: 'study' });
    expect(STANDARD_FOCUS_MAX_DURATION_MINUTES).toBe(120);
  });
});
