import { describe, expect, it, vi } from 'vitest';

import { createHistorySlice } from './create-history-slice';

describe('createHistorySlice', () => {
  it('wires the production history query through the fixed first-page use case', async () => {
    const list = vi.fn(async () => ({
      ok: true as const,
      value: { entries: [], nextCursor: null },
    }));
    const criticalRecovery = { enterRecovery: vi.fn() };
    const listRange = vi.fn(async () => ({ ok: true as const, value: [] }));
    const enqueueBounded = vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const }));
    const slice = createHistorySlice({
      analyticsQueue: { enqueueBounded },
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-12', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => 1_000 },
      contribution: { listRange },
      criticalRecovery,
      history: { list },
      id: { nextId: () => 'history-episode-1' },
      readBootstrap: () => ({
        status: 'ready',
        snapshot: { settings: { analyticsEnabled: true } },
      } as never),
    });

    await Promise.all([slice.controller.activate(), slice.contribution.activate()]);
    expect(list).toHaveBeenCalledExactlyOnceWith({
      profileId: 1,
      limit: 20,
      cursor: null,
    });
    expect(slice.controller.getSnapshot()).toEqual({ status: 'empty', refresh: 'idle' });
    expect(listRange).toHaveBeenCalledExactlyOnceWith({
      profileId: 1,
      startLocalDate: '2026-09-06',
      endLocalDate: '2026-09-12',
    });
    expect(slice.contribution.getSnapshot()).toMatchObject({
      status: 'ready',
      value: { days: [{ completedMinutes: 0 }, {}, {}, {}, {}, {}, {}] },
    });
    expect(criticalRecovery.enterRecovery).not.toHaveBeenCalled();
    expect(enqueueBounded).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'history_viewed:history-episode-1',
      eventName: 'history_viewed',
      properties: {},
    }), 1_000);
    slice.dispose();
  });
});
