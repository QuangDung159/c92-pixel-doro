import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsEventRecord } from '../persistence';
import {
  ANALYTICS_RETRY_BASE_MS,
  AnalyticsDeliveryCoordinator,
  analyticsRetryAt,
} from './analytics-delivery.coordinator';

const event = (eventId: string, attemptCount = 0): AnalyticsEventRecord => ({
  eventId,
  eventName: 'history_viewed',
  properties: {},
  occurredAt: 1_000,
  expiresAt: 604_801_000,
  deliveryState: attemptCount === 0 ? 'pending' : 'retry_wait',
  attemptCount,
  nextAttemptAt: attemptCount === 0 ? null : 2_000,
  createdAt: 1_000,
});

const setup = (outcome: 'accepted' | 'retryable' = 'accepted') => {
  let enabled = true;
  let generation = 0;
  const queue = {
    listDue: vi.fn().mockResolvedValue({ ok: true, value: [event('one'), event('two')] }),
    markRetry: vi.fn().mockResolvedValue({ ok: true, value: 'updated' }),
    deleteDelivered: vi.fn().mockResolvedValue({ ok: true, value: 2 }),
  };
  const deliver = vi.fn().mockResolvedValue(outcome);
  const coordinator = new AnalyticsDeliveryCoordinator({
    clock: { nowMs: () => 10_000 },
    delivery: { deliver },
    gate: { isEnabled: () => enabled, generation: () => generation },
    installation: { find: vi.fn().mockResolvedValue({
      ok: true,
      value: {
        id: 1, installedAt: 0, onboardingCompletedAt: 1,
        anonymousAnalyticsId: 'anonymous', createdAt: 0, updatedAt: 0,
      },
    }) },
    queue,
  });
  return {
    coordinator,
    deliver,
    queue,
    block: () => { enabled = false; generation += 1; },
  };
};

describe('AnalyticsDeliveryCoordinator', () => {
  it('coalesces concurrent flushes and deletes only after accepted batch', async () => {
    const fixture = setup();
    const [first, second] = await Promise.all([
      fixture.coordinator.flush(), fixture.coordinator.flush(),
    ]);
    expect(first).toBe('accepted');
    expect(second).toBe('accepted');
    expect(fixture.deliver).toHaveBeenCalledTimes(1);
    expect(fixture.queue.deleteDelivered).toHaveBeenCalledWith(['one', 'two']);
    expect(fixture.queue.markRetry).not.toHaveBeenCalled();
  });

  it('marks every failed event with deterministic exponential retry', async () => {
    const fixture = setup('retryable');
    expect(await fixture.coordinator.flush()).toBe('retry_scheduled');
    expect(fixture.queue.markRetry).toHaveBeenCalledTimes(2);
    expect(fixture.queue.deleteDelivered).not.toHaveBeenCalled();
    const firstInput = fixture.queue.markRetry.mock.calls[0]?.[0];
    expect(firstInput).toMatchObject({ eventId: 'one', attemptCount: 1 });
    expect(firstInput.nextAttemptAt).toBeGreaterThanOrEqual(10_000 + ANALYTICS_RETRY_BASE_MS);
    expect(analyticsRetryAt(event('stable'), 10_000)).toBe(
      analyticsRetryAt(event('stable'), 10_000),
    );
  });

  it('ignores a provider completion made stale by opt-out', async () => {
    let release!: () => void;
    const fixture = setup();
    fixture.deliver.mockImplementation(() => new Promise<'accepted'>((resolve) => {
      release = () => resolve('accepted');
    }));
    const operation = fixture.coordinator.flush();
    await vi.waitFor(() => expect(fixture.deliver).toHaveBeenCalledTimes(1));
    fixture.block();
    release();
    expect(await operation).toBe('stale');
    expect(fixture.queue.deleteDelivered).not.toHaveBeenCalled();
    expect(fixture.queue.markRetry).not.toHaveBeenCalled();
  });
});

