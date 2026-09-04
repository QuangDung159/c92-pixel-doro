import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { StandardFocusSetupController } from './standard-focus-setup.controller';

const session = {
  id: 'focus-1', status: 'running', resolvedAt: null, xpEarned: 0,
  coinsEarned: 0, rewardClaimedAt: null,
} as RunningSessionRecord;

describe('StandardFocusSetupController', () => {
  it('uses exact defaults and rejects invalid UI candidates without clamping', () => {
    const controller = new StandardFocusSetupController({
      start: async () => ({ ok: true, session }),
    });
    expect(controller.getSnapshot().configuration).toEqual({
      durationMinutes: 25, mode: 'relax', workTag: 'coding',
    });
    controller.setDuration(17);
    expect(controller.getSnapshot().configuration.durationMinutes).toBe(25);
    controller.setDuration(50);
    controller.setMode('strict');
    controller.setWorkTag('study');
    expect(controller.getSnapshot().configuration).toEqual({
      durationMinutes: 50, mode: 'strict', workTag: 'study',
    });
  });

  it('coalesces double tap, disables draft edits, and resets after committed success', async () => {
    let resolve!: (result: { ok: true; session: RunningSessionRecord }) => void;
    const start = vi.fn(() => new Promise<{ ok: true; session: RunningSessionRecord }>(
      (done) => { resolve = done; },
    ));
    const controller = new StandardFocusSetupController({ start });
    controller.setDuration(50);
    const first = controller.start();
    const second = controller.start();
    controller.setDuration(25);
    expect(first).toBe(second);
    expect(controller.getSnapshot()).toMatchObject({
      configuration: { durationMinutes: 50 }, command: { status: 'submitting' },
    });
    resolve({ ok: true, session });
    await first;
    expect(start).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({
      configuration: { durationMinutes: 25, mode: 'relax', workTag: 'coding' },
      command: { status: 'idle' },
    });
  });

  it('preserves the draft across failure and retry', async () => {
    const start = vi.fn()
      .mockResolvedValueOnce({ ok: false, error: { code: 'ACTIVE_SESSION' } })
      .mockResolvedValueOnce({ ok: true, session });
    const controller = new StandardFocusSetupController({ start });
    controller.setWorkTag('writing');
    expect(await controller.start()).toMatchObject({ ok: false });
    expect(controller.getSnapshot()).toMatchObject({
      configuration: { workTag: 'writing' },
      command: { status: 'error', error: { code: 'ACTIVE_SESSION' } },
    });
    expect(await controller.start()).toMatchObject({ ok: true });
    expect(start).toHaveBeenCalledTimes(2);
  });
});
