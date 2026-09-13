import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsDeliveryCoordinator } from '@/application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('analytics delivery durable retry', () => {
  it('persists retry metadata across close/reopen and deletes only after acceptance', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us11-delivery-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    let currentNow = now;
    const deliver = vi.fn()
      .mockResolvedValueOnce('retryable')
      .mockResolvedValueOnce('accepted');
    const createCoordinator = (database: Awaited<ReturnType<typeof openDatabase>>) =>
      new AnalyticsDeliveryCoordinator({
        clock: { nowMs: () => currentNow },
        delivery: { deliver },
        gate: { isEnabled: () => true, generation: () => 0 },
        installation: database.graph.installation,
        queue: database.graph.analyticsQueue,
      });

    const first = await openDatabase(driver, 'analytics-relaunch.db');
    expect(await first.graph.analyticsQueue.enqueueBounded({
      eventId: 'history_viewed:episode-1',
      eventName: 'history_viewed',
      properties: {},
      occurredAt: now,
      expiresAt: now + 604_800_000,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: now,
    }, now)).toMatchObject({ ok: true, value: 'enqueued' });
    const firstCoordinator = createCoordinator(first);
    await expect(firstCoordinator.flush()).resolves.toBe('retry_scheduled');
    const retryRow = await first.graph.analyticsEvents.findById(
      'history_viewed:episode-1',
    );
    expect(retryRow).toMatchObject({
      ok: true,
      value: { deliveryState: 'retry_wait', attemptCount: 1 },
    });
    if (!retryRow.ok || retryRow.value === null || retryRow.value.nextAttemptAt === null) {
      throw new Error('retry row missing');
    }
    currentNow = retryRow.value.nextAttemptAt;
    firstCoordinator.dispose();
    await first.owner.close();

    const reopened = await openDatabase(driver, 'analytics-relaunch.db');
    const reopenedCoordinator = createCoordinator(reopened);
    await expect(reopenedCoordinator.flush()).resolves.toBe('accepted');
    await expect(reopened.graph.analyticsEvents.findById(
      'history_viewed:episode-1',
    )).resolves.toEqual({ ok: true, value: null });
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver.mock.calls[0]?.[0]).toMatchObject({
      anonymousId: 'installation-id',
      events: [{ eventId: 'history_viewed:episode-1' }],
    });
    reopenedCoordinator.dispose();
    await reopened.owner.close();
  });
});
