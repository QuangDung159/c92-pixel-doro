import { describe, expect, it, vi } from 'vitest';

import type {
  StandardFocusHistoryEntry,
  StandardFocusHistoryQuery,
} from '../persistence/derived-query';
import { persistenceError } from '../persistence/persistence.error';
import {
  FOCUS_HISTORY_PAGE_SIZE,
  LoadFocusHistoryPageUseCase,
} from './load-focus-history-page.use-case';

const entry = (
  id: string,
  endsAt: number,
  overrides: Partial<StandardFocusHistoryEntry> = {},
): StandardFocusHistoryEntry => ({
  id,
  status: 'completed',
  mode: 'relax',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  startedAt: endsAt - 25 * 60_000,
  endsAt,
  resolvedAt: endsAt,
  scheduledEndLocalDate: '2026-09-11',
  scheduledEndUtcOffsetMinutes: 420,
  ...overrides,
});

const query = (
  entries: readonly StandardFocusHistoryEntry[] = [],
  nextCursor: { readonly endsAt: number; readonly id: string } | null = null,
): StandardFocusHistoryQuery => ({
  list: vi.fn(async () => ({ ok: true as const, value: { entries, nextCursor } })),
});

describe('LoadFocusHistoryPageUseCase', () => {
  it('loads the fixed first page and returns only immutable UI facts', async () => {
    const history = query([
      entry('completed', 6_000_000),
      entry('failed', 4_000_000, {
        status: 'failed', mode: 'strict', workTag: 'study',
      }),
      entry('cancelled', 2_000_000, {
        status: 'cancelled', workTag: 'writing',
      }),
    ]);
    const result = await new LoadFocusHistoryPageUseCase({ history }).execute();

    expect(history.list).toHaveBeenCalledWith({
      profileId: 1,
      limit: 20,
      cursor: null,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        items: [
          {
            id: 'completed', status: 'completed', workTag: 'coding',
            configuredDurationMinutes: 25, endsAt: 6_000_000,
            scheduledEndLocalDate: '2026-09-11',
          },
          {
            id: 'failed', status: 'failed', workTag: 'study',
            configuredDurationMinutes: 25, endsAt: 4_000_000,
            scheduledEndLocalDate: '2026-09-11',
          },
          {
            id: 'cancelled', status: 'cancelled', workTag: 'writing',
            configuredDurationMinutes: 25, endsAt: 2_000_000,
            scheduledEndLocalDate: '2026-09-11',
          },
        ],
        nextCursor: null,
      },
    });
    if (!result.ok) throw new Error('expected history projection');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.items)).toBe(true);
    expect(result.value.items.every(Object.isFrozen)).toBe(true);
    expect(result.value.items[0]).not.toHaveProperty('mode');
    expect(result.value.items[0]).not.toHaveProperty('resolvedAt');
  });

  it('accepts a full page cursor that matches the final stable row', async () => {
    const entries = Array.from({ length: FOCUS_HISTORY_PAGE_SIZE }, (_, index) =>
      entry(`session-${String(index).padStart(2, '0')}`, 100_000_000 - index * 2_000_000));
    const last = entries.at(-1)!;
    const result = await new LoadFocusHistoryPageUseCase({
      history: query(entries, { endsAt: last.endsAt, id: last.id }),
    }).execute();
    expect(result).toMatchObject({
      ok: true,
      value: { nextCursor: { endsAt: last.endsAt, id: last.id } },
    });
    if (!result.ok || result.value.nextCursor === null) throw new Error('expected cursor');
    expect(Object.isFrozen(result.value.nextCursor)).toBe(true);
  });

  it.each([
    ['duplicate id', [entry('same', 4_000_000), entry('same', 2_000_000)], null],
    ['wrong order', [entry('older', 2_000_000), entry('newer', 4_000_000)], null],
    ['wrong equal-time id order', [entry('z', 2_000_000), entry('a', 2_000_000)], null],
    ['impossible date', [entry('x', 2_000_000, { scheduledEndLocalDate: '2026-02-30' })], null],
    ['invalid duration', [entry('x', 2_000_000, { configuredDurationMinutes: 16 })], null],
    ['invalid status', [entry('x', 2_000_000, { status: 'running' as never })], null],
    ['invalid tag', [entry('x', 2_000_000, { workTag: 'meeting' as never })], null],
    ['invalid timestamp', [entry('x', 2_000_000, { endsAt: Number.MAX_SAFE_INTEGER })], null],
    ['cursor on short page', [entry('x', 2_000_000)], { endsAt: 2_000_000, id: 'x' }],
    ['cursor mismatch', Array.from({ length: 20 }, (_, index) =>
      entry(`session-${index}`, 100_000_000 - index * 2_000_000)), { endsAt: 12, id: 'wrong' }],
    ['too many entries', Array.from({ length: 21 }, (_, index) =>
      entry(`session-${index}`, 100_000_000 - index * 2_000_000)), null],
  ] as const)('fails closed for %s', async (_label, entries, nextCursor) => {
    const result = await new LoadFocusHistoryPageUseCase({
      history: query(entries, nextCursor),
    }).execute();
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'load_focus_history_page_error',
        code: 'HISTORY_DATA_INVALID',
      },
    });
  });

  it.each([
    'PERSISTENCE_UNAVAILABLE',
    'PERSISTENCE_QUERY_FAILED',
    'PERSISTENCE_WRITE_FAILED',
    'PERSISTENCE_CONFLICT',
  ] as const)('maps %s to a local read error', async (code) => {
    const history: StandardFocusHistoryQuery = {
      list: vi.fn(async () => ({
        ok: false as const,
        error: persistenceError(code, 'sessions'),
      })),
    };
    await expect(new LoadFocusHistoryPageUseCase({ history }).execute()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'load_focus_history_page_error',
        code: 'HISTORY_READ_FAILED',
      },
    });
  });

  it.each([
    'PERSISTENCE_CORRUPT_DATA',
    'PERSISTENCE_INVARIANT_MISMATCH',
  ] as const)('maps %s to invalid durable data', async (code) => {
    const history: StandardFocusHistoryQuery = {
      list: vi.fn(async () => ({
        ok: false as const,
        error: persistenceError(code, 'sessions'),
      })),
    };
    await expect(new LoadFocusHistoryPageUseCase({ history }).execute()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'load_focus_history_page_error',
        code: 'HISTORY_DATA_INVALID',
      },
    });
  });

  it('maps a thrown query to a local read error', async () => {
    const history: StandardFocusHistoryQuery = {
      list: vi.fn(async () => { throw new Error('offline read failure'); }),
    };
    await expect(new LoadFocusHistoryPageUseCase({ history }).execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'HISTORY_READ_FAILED' },
    });
  });
});
