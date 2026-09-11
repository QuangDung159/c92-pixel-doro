import { describe, expect, it, vi } from 'vitest';

import {
  createEpic08ExitReviewFixture,
  epic08ExitReviewDatabaseName,
  resolveEpic08ExitReviewScenario,
} from './epic-08-exit-review-fixture';

const queue = () => ({
  enqueueBounded: vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const })),
  listDue: vi.fn(async () => ({ ok: true as const, value: [] })),
  markRetry: vi.fn(async () => ({ ok: true as const, value: 'updated' as const })),
  deleteDelivered: vi.fn(async () => ({ ok: true as const, value: 0 })),
  clear: vi.fn(async () => ({ ok: true as const, value: 0 })),
});

describe('EPIC-08 exit review fixture', () => {
  it('is finite, dev-gated, and always selects a dedicated database', () => {
    expect(resolveEpic08ExitReviewScenario('epic_08_relaunch_committed', true))
      .toBe('epic_08_relaunch_committed');
    expect(resolveEpic08ExitReviewScenario('epic_08_relaunch_committed', false))
      .toBeUndefined();
    expect(resolveEpic08ExitReviewScenario('epic_08_all_errors_once', true))
      .toBeUndefined();
    expect(epic08ExitReviewDatabaseName('epic_08_relaunch_committed'))
      .toBe('pixeldoro-us-08-05-epic_08_relaunch_committed.db');
    expect(epic08ExitReviewDatabaseName('epic_08_relaunch_committed'))
      .not.toBe('pixeldoro.db');
  });

  it('isolates provider failure from the delegated product database queue', async () => {
    const delegate = queue();
    const fixture = createEpic08ExitReviewFixture('epic_08_provider_failure', delegate);
    expect(fixture).toBeDefined();
    if (fixture === undefined) throw new Error('fixture missing');
    const result = await fixture.analyticsQueue.enqueueBounded({
      eventId: 'shop_viewed:episode',
      eventName: 'shop_viewed',
      properties: {},
      occurredAt: 1,
      expiresAt: 2,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: 1,
    }, 1);
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_WRITE_FAILED', entity: 'analytics_events' },
    });
    expect(delegate.enqueueBounded).not.toHaveBeenCalled();
    await fixture.analyticsQueue.listDue(1, 10);
    expect(delegate.listDue).toHaveBeenCalledWith(1, 10);
  });
});
