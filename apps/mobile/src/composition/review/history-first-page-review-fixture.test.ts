import { describe, expect, it, vi } from 'vitest';

import type { StandardFocusHistoryQuery } from '@pixeldoro/application';

import {
  createHistoryFirstPageReviewFixture,
  historyFirstPageReviewDatabaseName,
  resolveHistoryFirstPageReviewScenario,
} from './history-first-page-review-fixture';

const entry = {
  id: 'session-1',
  status: 'completed' as const,
  mode: 'relax' as const,
  workTag: 'coding' as const,
  configuredDurationMinutes: 25,
  startedAt: 1_000,
  endsAt: 1_501_000,
  resolvedAt: 1_501_000,
  scheduledEndLocalDate: '2026-09-11',
  scheduledEndUtcOffsetMinutes: 420,
};

const delegate = (): StandardFocusHistoryQuery => ({
  list: vi.fn(async () => ({
    ok: true as const,
    value: { entries: [entry], nextCursor: null },
  })),
});

describe('history first-page review fixture', () => {
  it('allows only finite dev scenarios and isolated database names', () => {
    expect(resolveHistoryFirstPageReviewScenario('history_first_page_mixed', true))
      .toBe('history_first_page_mixed');
    expect(resolveHistoryFirstPageReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveHistoryFirstPageReviewScenario('history_first_page_mixed', false))
      .toBeUndefined();
    expect(historyFirstPageReviewDatabaseName('history_first_page_empty'))
      .toBe('pixeldoro-us-09-01-history_first_page_empty.db');
  });

  it('injects one read failure and then delegates', async () => {
    const source = delegate();
    const fixture = createHistoryFirstPageReviewFixture(
      'history_first_page_read_failure_once',
      source,
    );
    const input = { profileId: 1, limit: 20, cursor: null };
    await expect(fixture?.history.list(input)).resolves.toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_QUERY_FAILED', field: 'review_once' },
    });
    await expect(fixture?.history.list(input)).resolves.toMatchObject({ ok: true });
    expect(source.list).toHaveBeenCalledOnce();
  });

  it('injects an impossible date without mutating delegate facts', async () => {
    const source = delegate();
    const fixture = createHistoryFirstPageReviewFixture('history_first_page_corrupt', source);
    const result = await fixture?.history.list({ profileId: 1, limit: 20, cursor: null });
    expect(result).toMatchObject({
      ok: true,
      value: { entries: [{ scheduledEndLocalDate: '2026-02-30' }] },
    });
    expect(entry.scheduledEndLocalDate).toBe('2026-09-11');
  });
});
