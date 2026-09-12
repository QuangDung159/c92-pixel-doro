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
    const slice = createHistorySlice({
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-12', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => 1_000 },
      contribution: { listRange },
      criticalRecovery,
      history: { list },
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
    slice.dispose();
  });
});
