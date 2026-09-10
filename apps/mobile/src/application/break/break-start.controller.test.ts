import type { RunningSessionRecord } from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import { BreakStartController, type BreakStartResult } from './break-start.controller';

const session: RunningSessionRecord = {
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 10_000, endsAt: 310_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 10_000, updatedAt: 10_000,
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('BreakStartController', () => {
  it('coalesces same-source presses and publishes committed identity', async () => {
    const pending = deferred<BreakStartResult>();
    const start = vi.fn(() => pending.promise);
    const afterCommitted = vi.fn(async () => undefined);
    const controller = new BreakStartController({ start, afterCommitted });

    const first = controller.start('focus-1');
    const second = controller.start('focus-1');
    expect(first).toBe(second);
    expect(start).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({
      status: 'submitting', sourceSessionId: 'focus-1',
    });
    pending.resolve({ ok: true, session });
    expect(await first).toEqual({ ok: true, session });
    expect(afterCommitted).toHaveBeenCalledWith(session);
    expect(controller.getSnapshot()).toEqual({
      status: 'committed', sourceSessionId: 'focus-1', breakSessionId: 'break-1',
    });
  });

  it('does not downgrade a durable commit when post-commit refresh fails', async () => {
    const controller = new BreakStartController({
      start: async () => ({ ok: true, session }),
      afterCommitted: async () => { throw new Error('pet unavailable'); },
    });
    expect(await controller.start('focus-1')).toEqual({ ok: true, session });
    expect(controller.getSnapshot().status).toBe('committed');
  });

  it('maps failure projection and suppresses a different concurrent source', async () => {
    const pending = deferred<BreakStartResult>();
    const controller = new BreakStartController({ start: () => pending.promise });
    const first = controller.start('focus-1');
    expect(await controller.start('focus-2')).toEqual({
      ok: false, error: { code: 'START_UNAVAILABLE' },
    });
    pending.resolve({ ok: false, error: { code: 'ACTIVE_SESSION' } });
    await first;
    expect(controller.getSnapshot()).toEqual({
      status: 'error', sourceSessionId: 'focus-1', error: { code: 'ACTIVE_SESSION' },
    });
  });
});
