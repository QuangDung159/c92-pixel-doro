import { describe, expect, it, vi } from 'vitest';

import { StandardFocusCancelController } from './standard-focus-cancel.controller';

describe('StandardFocusCancelController', () => {
  it('coalesces cancel and requests Pet refresh only after committed success', async () => {
    let resolve!: (value: { ok: true; value: { outcome: 'cancelled'; sessionId: string } }) => void;
    const cancel = vi.fn(() => new Promise<{
      ok: true; value: { outcome: 'cancelled'; sessionId: string };
    }>((done) => { resolve = done; }));
    const refreshPet = vi.fn(async () => undefined);
    const controller = new StandardFocusCancelController({ cancel, refreshPet });
    const first = controller.cancel('focus-1');
    const second = controller.cancel('focus-1');
    expect(first).toBe(second);
    expect(controller.getSnapshot()).toEqual({ status: 'submitting', sessionId: 'focus-1' });
    expect(refreshPet).not.toHaveBeenCalled();
    resolve({ ok: true, value: { outcome: 'cancelled', sessionId: 'focus-1' } });
    await expect(first).resolves.toEqual({
      ok: true,
      sessionId: 'focus-1',
      terminalStatus: 'cancelled',
    });
    expect(refreshPet).toHaveBeenCalledOnce();
  });

  it('maps deadline failure and leaves refresh untouched', async () => {
    const refreshPet = vi.fn();
    const controller = new StandardFocusCancelController({
      cancel: async () => ({
        ok: false,
        error: { kind: 'cancel_standard_focus_error', code: 'SESSION_DEADLINE_REACHED' },
      }),
      refreshPet,
    });
    expect(await controller.cancel('focus-1')).toEqual({ ok: false });
    expect(controller.getSnapshot()).toEqual({
      status: 'error', error: { code: 'DEADLINE_REACHED' },
    });
    expect(refreshPet).not.toHaveBeenCalled();
  });
});
