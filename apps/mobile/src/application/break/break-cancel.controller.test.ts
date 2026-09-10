import { describe, expect, it, vi } from 'vitest';

import { BreakCancelController, type BreakCancelControllerDependencies } from './break-cancel.controller';

type CancelResponse = Awaited<ReturnType<BreakCancelControllerDependencies['cancel']>>;

describe('BreakCancelController', () => {
  it('coalesces exact duplicate cancel and hydrates committed winner once', async () => {
    let resolve: ((value: CancelResponse) => void) | undefined;
    const cancel: BreakCancelControllerDependencies['cancel'] = vi.fn(
      () => new Promise<CancelResponse>((done) => { resolve = done; }),
    );
    const afterCommitted = vi.fn(async () => undefined);
    const controller = new BreakCancelController({ cancel, afterCommitted });
    const first = controller.cancel('break-1');
    const duplicate = controller.cancel('break-1');
    expect(first).toBe(duplicate);
    resolve?.({ ok: true, value: { outcome: 'cancelled', sessionId: 'break-1',
      resolvedAt: 2_000, freshness: 'fresh_commit' } });
    await expect(first).resolves.toEqual({ ok: true, sessionId: 'break-1',
      terminalStatus: 'cancelled' });
    expect(cancel).toHaveBeenCalledOnce(); expect(afterCommitted).toHaveBeenCalledOnce();
  });

  it('rejects a different identity while pending and maps failures', async () => {
    let resolve: ((value: CancelResponse) => void) | undefined;
    const controller = new BreakCancelController({
      cancel: () => new Promise<CancelResponse>((done) => { resolve = done; }),
      afterCommitted: async () => undefined,
    });
    const pending = controller.cancel('break-1');
    await expect(controller.cancel('break-2')).resolves.toEqual({ ok: false });
    resolve?.({ ok: false, error: { kind: 'cancel_break_error',
      code: 'BREAK_CANCEL_WRITE_FAILED' } });
    await pending;
    expect(controller.getSnapshot()).toEqual({ status: 'error', code: 'CANCEL_UNAVAILABLE' });
  });

  it('returns durable completion winner and ignores post-commit hydration failure', async () => {
    const controller = new BreakCancelController({
      cancel: async () => ({ ok: true, value: { outcome: 'completed', sessionId: 'break-1',
        resolvedAt: 301_000, freshness: 'fresh_commit' } }),
      afterCommitted: async () => { throw new Error('read'); },
    });
    await expect(controller.cancel('break-1')).resolves.toEqual({ ok: true,
      sessionId: 'break-1', terminalStatus: 'completed' });
  });

  it('resets only while idle and detaches safely on dispose', async () => {
    let resolve: ((value: CancelResponse) => void) | undefined;
    const listener = vi.fn();
    const controller = new BreakCancelController({
      cancel: () => new Promise<CancelResponse>((done) => { resolve = done; }),
      afterCommitted: async () => undefined,
    });
    controller.subscribe(listener);
    const pending = controller.cancel('break-1');
    controller.reset();
    expect(controller.getSnapshot()).toEqual({ status: 'submitting', sessionId: 'break-1' });
    controller.dispose();
    resolve?.({ ok: true, value: { outcome: 'cancelled', sessionId: 'break-1',
      resolvedAt: 2_000, freshness: 'fresh_commit' } });
    await expect(pending).resolves.toEqual({ ok: false });
    expect(listener).toHaveBeenCalledOnce();
    await expect(controller.cancel('break-1')).resolves.toEqual({ ok: false });
  });
});
