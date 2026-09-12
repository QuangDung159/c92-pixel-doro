import { describe, expect, it, vi } from 'vitest';

import {
  LoadFocusHistoryPageUseCase,
  type StandardFocusHistoryEntry,
  type StandardFocusHistoryQuery,
} from '@pixeldoro/application';

import {
  createHistoryGroupedReviewFixture,
  historyGroupedReviewDatabaseName,
  resolveHistoryGroupedReviewScenario,
} from './history-grouped-review-fixture';

const entries = Array.from({ length: 21 }, (_, index): StandardFocusHistoryEntry => {
  const number = 20 - index;
  const endsAt = 100_000_000 - index * 2_000_000;
  return {
    id: `us0902-history-${String(number).padStart(2, '0')}`,
    status: number % 5 === 0 ? 'cancelled' : 'completed',
    mode: 'relax',
    workTag: 'coding',
    configuredDurationMinutes: 25,
    startedAt: endsAt - 25 * 60_000,
    endsAt,
    resolvedAt: endsAt,
    scheduledEndLocalDate: number < 7
      ? '2026-09-09' : number < 14 ? '2026-09-10' : '2026-09-11',
    scheduledEndUtcOffsetMinutes: 420,
  };
});

const delegate = (): StandardFocusHistoryQuery => ({
  list: vi.fn(async (input) => {
    const available = input.cursor === null ? entries : entries.filter((entry) =>
      entry.endsAt < input.cursor!.endsAt ||
      (entry.endsAt === input.cursor!.endsAt && entry.id > input.cursor!.id));
    const page = available.slice(0, input.limit);
    const last = page.at(-1);
    return {
      ok: true as const,
      value: {
        entries: page,
        nextCursor: available.length > input.limit && last !== undefined
          ? { endsAt: last.endsAt, id: last.id }
          : null,
      },
    };
  }),
});

describe('history grouped review fixture', () => {
  it('allows only finite dev scenarios and isolated Story-02 database names', () => {
    expect(resolveHistoryGroupedReviewScenario('history_grouped_21', true))
      .toBe('history_grouped_21');
    expect(resolveHistoryGroupedReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveHistoryGroupedReviewScenario('history_grouped_21', false)).toBeUndefined();
    expect(historyGroupedReviewDatabaseName('history_grouped_21'))
      .toBe('pixeldoro-us-09-02-history_grouped_21.db');
  });

  it('fails append once and delegates the exact retry', async () => {
    const source = delegate();
    const fixture = createHistoryGroupedReviewFixture('history_load_more_failure_once', source)!;
    const cursor = { endsAt: entries[19]!.endsAt, id: entries[19]!.id };
    const input = { profileId: 1, limit: 20, cursor };
    await expect(fixture.history.list(input)).resolves.toMatchObject({
      ok: false, error: { field: 'review_append_once' },
    });
    await expect(fixture.history.list(input)).resolves.toMatchObject({ ok: true });
    expect(source.list).toHaveBeenCalledOnce();
  });

  it('fails only the first refresh after initial load', async () => {
    const fixture = createHistoryGroupedReviewFixture(
      'history_refresh_failure_once', delegate(),
    )!;
    const input = { profileId: 1, limit: 20, cursor: null };
    await expect(fixture.history.list(input)).resolves.toMatchObject({ ok: true });
    await expect(fixture.history.list(input)).resolves.toMatchObject({
      ok: false, error: { field: 'review_refresh_once' },
    });
    await expect(fixture.history.list(input)).resolves.toMatchObject({ ok: true });
  });

  it('reveals the newest durable row on refresh', async () => {
    const fixture = createHistoryGroupedReviewFixture(
      'history_new_terminal_on_refresh', delegate(),
    )!;
    const input = { profileId: 1, limit: 20, cursor: null };
    const initial = await fixture.history.list(input);
    const refreshed = await fixture.history.list(input);
    expect(initial).toMatchObject({ ok: true });
    expect(refreshed).toMatchObject({ ok: true });
    if (!initial.ok || !refreshed.ok) throw new Error('expected review pages');
    expect(initial.value.entries.map((entry) => entry.id))
      .not.toContain('us0902-history-20');
    expect(refreshed.value.entries[0]?.id).toBe('us0902-history-20');
  });

  it('keeps equal endsAt IDs stable across the page boundary', async () => {
    const fixture = createHistoryGroupedReviewFixture(
      'history_equal_end_boundary', delegate(),
    )!;
    const loader = new LoadFocusHistoryPageUseCase({ history: fixture.history });
    const firstPage = await loader.execute({ cursor: null });
    expect(firstPage).toMatchObject({ ok: true });
    if (!firstPage.ok || firstPage.value.nextCursor === null) {
      throw new Error('expected first fixture cursor');
    }
    const nextPage = await loader.execute({ cursor: firstPage.value.nextCursor });
    expect(nextPage).toMatchObject({ ok: true, value: { items: [{ id: 'us0902-history-01' }] } });
    const allIds = firstPage.value.items.map((item) => item.id).concat(
      nextPage.ok ? nextPage.value.items.map((item) => item.id) : [],
    );
    expect(new Set(allIds).size).toBe(21);
  });
});
