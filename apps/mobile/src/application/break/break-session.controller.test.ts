import { describe, expect, it, vi } from 'vitest';

import { BreakSessionController } from './break-session.controller';

const running = { status: 'running' as const, sessionId: 'break-1', kind: 'short' as const,
  durationMinutes: 5 as const, startedAt: 10, endsAt: 300_010 };

const create = (nowMs = 10) => {
  const scheduler = { schedule: vi.fn(() => vi.fn()) };
  const controller = new BreakSessionController({
    clock: { nowMs: () => nowMs }, scheduler,
    loader: { execute: async (sessionId: string) => ({ ok: true as const,
      value: { ...running, sessionId } }) },
  });
  return { controller, scheduler };
};

describe('BreakSessionController', () => {
  it('projects exact timestamp truth and resets', async () => {
    const { controller } = create();
    await controller.refresh('break-1');
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', phase: 'running', session: running,
      remainingMs: 300_000, displaySeconds: 300,
    });
    controller.reset();
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('ticks only while route and app are visible', async () => {
    let now = 10;
    let tick: (() => void) | undefined;
    const cancel = vi.fn();
    const scheduler = { schedule: vi.fn((callback: () => void) => {
      tick = callback; return cancel;
    }) };
    const controller = new BreakSessionController({
      clock: { nowMs: () => now }, scheduler,
      loader: { execute: async () => ({ ok: true as const, value: running }) },
    });
    controller.activate('break-1');
    await controller.refresh();
    expect(scheduler.schedule).toHaveBeenCalled();
    now = 1_510;
    tick?.();
    expect(controller.getSnapshot()).toMatchObject({ displaySeconds: 299 });
    controller.setAppVisible(false);
    expect(cancel).toHaveBeenCalled();
  });

  it('publishes deadline pending once without another tick', async () => {
    const onDeadlineReached = vi.fn();
    const scheduler = { schedule: vi.fn(() => vi.fn()) };
    const controller = new BreakSessionController({
      clock: { nowMs: () => 300_010 }, scheduler, onDeadlineReached,
      loader: { execute: async () => ({ ok: true as const, value: running }) },
    });
    controller.activate('break-1');
    await controller.refresh();
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', phase: 'deadline_pending', displaySeconds: 0,
    });
    expect(onDeadlineReached).toHaveBeenCalledOnce();
    expect(scheduler.schedule).not.toHaveBeenCalled();
  });

  it('publishes exact committed completion', async () => {
    const controller = new BreakSessionController({
      clock: { nowMs: () => 400_000 }, scheduler: { schedule: vi.fn() },
      loader: { execute: async () => ({ ok: true as const, value: {
        ...running, status: 'completed' as const, resolvedAt: 301_000,
      } }) },
    });
    await controller.refresh('break-1');
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', phase: 'completed', session: { sessionId: 'break-1', resolvedAt: 301_000 },
    });
  });

  it('maps ineligible and read failures separately', async () => {
    const build = (code: 'BREAK_SESSION_INELIGIBLE' | 'BREAK_SESSION_READ_FAILED') =>
      new BreakSessionController({
        clock: { nowMs: () => 0 }, scheduler: { schedule: vi.fn() },
        loader: { execute: async () => ({ ok: false as const,
          error: { kind: 'load_break_session_error' as const, code } }) },
      });
    const ineligible = build('BREAK_SESSION_INELIGIBLE');
    await ineligible.refresh('break-1');
    expect(ineligible.getSnapshot()).toEqual({ status: 'error', code: 'SESSION_UNAVAILABLE' });
    const unavailable = build('BREAK_SESSION_READ_FAILED');
    await unavailable.refresh('break-1');
    expect(unavailable.getSnapshot()).toEqual({ status: 'error', code: 'SESSION_READ_FAILED' });
  });

  it('ignores an old in-flight read when the exact route identity changes', async () => {
    let resolveOld: ((value: { ok: true; value: typeof running }) => void) | undefined;
    const controller = new BreakSessionController({
      clock: { nowMs: () => 10 }, scheduler: { schedule: vi.fn(() => vi.fn()) },
      loader: { execute: (sessionId: string) => sessionId === 'break-old'
        ? new Promise((resolve) => { resolveOld = resolve; })
        : Promise.resolve({ ok: true as const, value: { ...running, sessionId } }) },
    });

    const oldRead = controller.refresh('break-old');
    const currentRead = controller.refresh('break-current');
    await currentRead;
    resolveOld?.({ ok: true, value: { ...running, sessionId: 'break-old' } });
    await oldRead;

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', session: { sessionId: 'break-current' },
    });
  });

  it('starts a fresh exact read after reset even when the old read is pending', async () => {
    let resolveOld: ((value: { ok: true; value: typeof running }) => void) | undefined;
    let reads = 0;
    const controller = new BreakSessionController({
      clock: { nowMs: () => 10 }, scheduler: { schedule: vi.fn(() => vi.fn()) },
      loader: { execute: () => {
        reads += 1;
        return reads === 1
          ? new Promise((resolve) => { resolveOld = resolve; })
          : Promise.resolve({ ok: true as const, value: running });
      } },
    });

    const oldRead = controller.refresh('break-1');
    controller.reset();
    await controller.refresh('break-1');
    resolveOld?.({ ok: true, value: running });
    await oldRead;

    expect(reads).toBe(2);
    expect(controller.getSnapshot()).toMatchObject({ status: 'ready', phase: 'running' });
  });
});
