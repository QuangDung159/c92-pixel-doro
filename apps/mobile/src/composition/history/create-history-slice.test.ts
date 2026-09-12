import { describe, expect, it, vi } from 'vitest';

import { createHistorySlice } from './create-history-slice';

describe('createHistorySlice', () => {
  it('wires the production history query through the fixed first-page use case', async () => {
    const list = vi.fn(async () => ({
      ok: true as const,
      value: { entries: [], nextCursor: null },
    }));
    const criticalRecovery = { enterRecovery: vi.fn() };
    const slice = createHistorySlice({
      criticalRecovery,
      history: { list },
    });

    await slice.controller.activate();
    expect(list).toHaveBeenCalledExactlyOnceWith({
      profileId: 1,
      limit: 20,
      cursor: null,
    });
    expect(slice.controller.getSnapshot()).toEqual({ status: 'empty', refresh: 'idle' });
    expect(criticalRecovery.enterRecovery).not.toHaveBeenCalled();
    slice.dispose();
  });
});
