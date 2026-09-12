import { describe, expect, it, vi } from 'vitest';

import {
  createEpic09ExitReviewFixture,
  epic09ExitReviewDatabaseName,
  resolveEpic09ExitReviewScenario,
} from './epic-09-exit-review-fixture';

const delegates = () => ({
  analyticsQueue: {
    enqueueBounded: vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const })),
    listDue: vi.fn(async () => ({ ok: true as const, value: [] })),
    markRetry: vi.fn(async () => ({ ok: true as const, value: 'updated' as const })),
    deleteDelivered: vi.fn(async () => ({ ok: true as const, value: 0 })),
    clear: vi.fn(async () => ({ ok: true as const, value: 0 })),
  },
  history: {
    list: vi.fn(async () => ({
      ok: true as const,
      value: { entries: [], nextCursor: null },
    })),
  },
  contribution: {
    listRange: vi.fn(async () => ({ ok: true as const, value: [] })),
  },
});

describe('EPIC-09 exit review fixture', () => {
  it('allows exactly six dev-gated scenarios with isolated databases', () => {
    const allowed = [
      'epic_09_empty',
      'epic_09_mixed_40',
      'epic_09_offline_relaunch',
      'epic_09_read_failure_once',
      'epic_09_analytics_failure_once',
      'epic_09_timezone_changed',
    ] as const;
    for (const scenario of allowed) {
      expect(resolveEpic09ExitReviewScenario(scenario, true)).toBe(scenario);
      expect(epic09ExitReviewDatabaseName(scenario))
        .toBe(`pixeldoro-us-09-05-${scenario}.db`);
      expect(epic09ExitReviewDatabaseName(scenario)).not.toBe('pixeldoro.db');
    }
    expect(resolveEpic09ExitReviewScenario('epic_09_mixed_40', false)).toBeUndefined();
    expect(resolveEpic09ExitReviewScenario('epic_09_unknown', true)).toBeUndefined();
  });

  it('fails each product read once and delegates exact retries', async () => {
    const source = delegates();
    const fixture = createEpic09ExitReviewFixture('epic_09_read_failure_once', source)!;
    const historyInput = { profileId: 1, limit: 20, cursor: null };
    const contributionInput = {
      profileId: 1,
      startLocalDate: '2026-09-06',
      endLocalDate: '2026-09-12',
    };

    await expect(fixture.history.list(historyInput)).resolves.toMatchObject({ ok: false });
    await expect(fixture.contribution.listRange(contributionInput))
      .resolves.toMatchObject({ ok: false });
    await expect(fixture.history.list(historyInput)).resolves.toMatchObject({ ok: true });
    await expect(fixture.contribution.listRange(contributionInput))
      .resolves.toMatchObject({ ok: true });
    expect(source.history.list).toHaveBeenCalledOnce();
    expect(source.contribution.listRange).toHaveBeenCalledOnce();
  });

  it('fails only the first analytics enqueue and preserves all other queue operations', async () => {
    const source = delegates();
    const fixture = createEpic09ExitReviewFixture('epic_09_analytics_failure_once', source)!;
    const event = {
      eventId: 'history_viewed:episode',
      eventName: 'history_viewed' as const,
      properties: {},
      occurredAt: 1,
      expiresAt: 2,
      deliveryState: 'pending' as const,
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1,
    };

    await expect(fixture.analyticsQueue.enqueueBounded(event, 1)).resolves.toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_WRITE_FAILED', entity: 'analytics_events' },
    });
    await expect(fixture.analyticsQueue.enqueueBounded(event, 1))
      .resolves.toMatchObject({ ok: true, value: 'enqueued' });
    expect(source.analyticsQueue.enqueueBounded).toHaveBeenCalledOnce();
    await fixture.analyticsQueue.listDue(1, 10);
    expect(source.analyticsQueue.listDue).toHaveBeenCalledWith(1, 10);
  });

  it('moves only the current calendar endpoint for the timezone scenario', () => {
    const fixture = createEpic09ExitReviewFixture('epic_09_timezone_changed', delegates())!;
    expect(fixture.calendar.snapshot(fixture.clock.nowMs())).toEqual({
      ok: true,
      value: { localDate: '2026-09-13', utcOffsetMinutes: 420 },
    });
  });
});
