import { describe, expect, it } from 'vitest';

import { BreakSessionController } from './break-session.controller';

describe('BreakSessionController', () => {
  it('publishes an exact durable running Break and resets', async () => {
    const controller = new BreakSessionController({ execute: async (sessionId) => ({
      ok: true,
      value: { sessionId, kind: 'short', durationMinutes: 5, startedAt: 10, endsAt: 300_010 },
    }) });
    await controller.refresh('break-1');
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      session: { sessionId: 'break-1', kind: 'short', durationMinutes: 5,
        startedAt: 10, endsAt: 300_010 },
    });
    controller.reset();
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('maps ineligible and read failures separately', async () => {
    const ineligible = new BreakSessionController({ execute: async () => ({
      ok: false,
      error: { kind: 'load_running_break_error', code: 'BREAK_SESSION_INELIGIBLE' },
    }) });
    await ineligible.refresh('break-1');
    expect(ineligible.getSnapshot()).toEqual({ status: 'error', code: 'SESSION_UNAVAILABLE' });

    const unavailable = new BreakSessionController({ execute: async () => ({
      ok: false,
      error: { kind: 'load_running_break_error', code: 'BREAK_SESSION_READ_FAILED' },
    }) });
    await unavailable.refresh('break-1');
    expect(unavailable.getSnapshot()).toEqual({ status: 'error', code: 'SESSION_READ_FAILED' });
  });
});
