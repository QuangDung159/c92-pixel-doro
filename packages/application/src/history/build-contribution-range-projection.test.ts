import { describe, expect, it } from 'vitest';

import type { ContributionDayFact } from '../persistence/derived-query';
import {
  buildContributionRangeProjection,
  contributionIntensityFor,
} from './build-contribution-range-projection';

const fact = (
  scheduledEndLocalDate: string,
  totalCompletedMinutes: number,
  completedSessionCount = 1,
): ContributionDayFact => ({
  scheduledEndLocalDate,
  totalCompletedMinutes,
  completedSessionCount,
});

describe('buildContributionRangeProjection', () => {
  it('builds seven chronological days and zero-fills a sparse leap-day range', () => {
    const facts = [
      fact('2028-02-27', 25),
      fact('2028-02-29', 50, 2),
      fact('2028-03-04', 100, 4),
    ];
    const result = buildContributionRangeProjection({
      endLocalDate: '2028-03-04',
      facts,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        startLocalDate: '2028-02-27',
        endLocalDate: '2028-03-04',
        days: [
          { localDate: '2028-02-27', completedMinutes: 25, completedSessionCount: 1, intensity: 'medium' },
          { localDate: '2028-02-28', completedMinutes: 0, completedSessionCount: 0, intensity: 'zero' },
          { localDate: '2028-02-29', completedMinutes: 50, completedSessionCount: 2, intensity: 'high' },
          { localDate: '2028-03-01', completedMinutes: 0, completedSessionCount: 0, intensity: 'zero' },
          { localDate: '2028-03-02', completedMinutes: 0, completedSessionCount: 0, intensity: 'zero' },
          { localDate: '2028-03-03', completedMinutes: 0, completedSessionCount: 0, intensity: 'zero' },
          { localDate: '2028-03-04', completedMinutes: 100, completedSessionCount: 4, intensity: 'peak' },
        ],
      },
    });
    if (!result.ok) throw new Error('expected projection');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.days)).toBe(true);
    expect(result.value.days.every(Object.isFrozen)).toBe(true);
    expect(facts).toHaveLength(3);
  });

  it('returns seven zero days for an empty sparse query', () => {
    const result = buildContributionRangeProjection({ endLocalDate: '2026-01-02', facts: [] });
    expect(result).toMatchObject({
      ok: true,
      value: {
        startLocalDate: '2025-12-27',
        days: [
          { localDate: '2025-12-27', completedMinutes: 0 },
          {}, {}, {}, {}, {},
          { localDate: '2026-01-02', completedMinutes: 0 },
        ],
      },
    });
  });

  it.each([
    [0, 'zero'], [1, 'low'], [24, 'low'], [25, 'medium'], [49, 'medium'],
    [50, 'high'], [99, 'high'], [100, 'peak'], [Number.MAX_SAFE_INTEGER, 'peak'],
  ] as const)('maps %i minutes to %s', (minutes, expected) => {
    expect(contributionIntensityFor(minutes)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid intensity input %s',
    (minutes) => expect(contributionIntensityFor(minutes)).toBeUndefined(),
  );

  it.each([
    ['impossible end date', '2026-02-30', []],
    ['range underflow', '0001-01-04', []],
    ['unsorted facts', '2026-09-12', [fact('2026-09-11', 25), fact('2026-09-10', 25)]],
    ['duplicate facts', '2026-09-12', [fact('2026-09-11', 25), fact('2026-09-11', 25)]],
    ['out-of-range fact', '2026-09-12', [fact('2026-09-05', 25)]],
    ['invalid date fact', '2026-09-12', [fact('2026-02-30', 25)]],
    ['zero sparse fact', '2026-09-12', [fact('2026-09-12', 0)]],
    ['impossible aggregate low', '2026-09-12', [fact('2026-09-12', 25, 2)]],
    ['impossible aggregate high', '2026-09-12', [fact('2026-09-12', 125, 1)]],
    ['unsafe count product', '2026-09-12', [fact('2026-09-12', Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)]],
  ] as const)('fails closed for %s', (_label, endLocalDate, facts) => {
    expect(buildContributionRangeProjection({ endLocalDate, facts })).toEqual({
      ok: false,
      error: {
        kind: 'contribution_projection_error',
        code: 'CONTRIBUTION_DATA_INVALID',
      },
    });
  });
});
