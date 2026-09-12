import { describe, expect, it } from 'vitest';

import type { FocusHistoryItemProjection } from './load-focus-history-page.use-case';
import { buildFocusHistorySections } from './build-focus-history-sections';

const item = (
  id: string,
  endsAt: number,
  localDate: string,
  overrides: Partial<FocusHistoryItemProjection> = {},
): FocusHistoryItemProjection => ({
  id,
  status: 'completed',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  endsAt,
  scheduledEndLocalDate: localDate,
  ...overrides,
});

describe('buildFocusHistorySections', () => {
  it('groups descending local dates and sums only completed configured minutes', () => {
    const items = [
      item('new-cancelled', 5_000, '2026-09-11', { status: 'cancelled' }),
      item('older-completed', 4_000, '2026-09-10', { configuredDurationMinutes: 50 }),
      item('same-day-failed', 3_000, '2026-09-11', { status: 'failed' }),
      item('oldest-completed', 2_000, '2026-09-10'),
    ];
    const result = buildFocusHistorySections(items);
    expect(result).toEqual({
      ok: true,
      value: [
        {
          localDate: '2026-09-11',
          completedMinutes: 0,
          items: [items[0], items[2]],
        },
        {
          localDate: '2026-09-10',
          completedMinutes: 75,
          items: [items[1], items[3]],
        },
      ],
    });
    if (!result.ok) throw new Error('expected grouped history');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(result.value.every(Object.isFrozen)).toBe(true);
    expect(result.value.every((section) => Object.isFrozen(section.items))).toBe(true);
  });

  it.each([
    ['duplicate ID', [item('same', 2_000, '2026-09-11'), item('same', 1_000, '2026-09-10')]],
    ['bad global order', [item('old', 1_000, '2026-09-11'), item('new', 2_000, '2026-09-10')]],
    ['bad equal-time order', [item('z', 2_000, '2026-09-11'), item('a', 2_000, '2026-09-11')]],
    ['invalid date', [item('bad-date', 2_000, '2026-02-30')]],
    ['invalid duration', [item('bad-duration', 2_000, '2026-09-11', {
      configuredDurationMinutes: 16,
    })]],
  ] as const)('fails closed for %s', (_label, items) => {
    expect(buildFocusHistorySections(items)).toMatchObject({
      ok: false,
      error: { code: 'HISTORY_DATA_INVALID' },
    });
  });

  it('returns a frozen empty section list', () => {
    const result = buildFocusHistorySections([]);
    expect(result).toEqual({ ok: true, value: [] });
    if (!result.ok) throw new Error('expected empty sections');
    expect(Object.isFrozen(result.value)).toBe(true);
  });
});
