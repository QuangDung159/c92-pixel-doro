import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { StandardFocusSessionController } from './standard-focus-session.controller';

const runningStandard = (mode: 'relax' | 'strict' = 'relax'): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode, status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

const dependencies = (nowMs = 2_000, mode: 'relax' | 'strict' = 'relax') => ({
  clock: { nowMs: () => nowMs },
  scheduler: { schedule: vi.fn(() => vi.fn()) },
  sessions: { findActive: async () => ({ ok: true as const, value: runningStandard(mode) }) },
});

describe('StandardFocusSessionController', () => {
  it('projects committed Relax facts from timestamp truth', async () => {
    const controller = new StandardFocusSessionController(dependencies());
    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', phase: 'running', sessionId: 'focus-1', durationMinutes: 25,
      mode: 'relax', workTag: 'coding', startedAt: 1_000, endsAt: 1_501_000,
      remainingMs: 1_499_000, displaySeconds: 1_499,
    });
  });

  it('ticks only while route and app are visible, then re-anchors on foreground', async () => {
    let now = 2_000;
    let callback: (() => void) | undefined;
    const cancel = vi.fn();
    const scheduler = {
      schedule: vi.fn((next: () => void) => { callback = next; return cancel; }),
    };
    const controller = new StandardFocusSessionController({
      ...dependencies(), clock: { nowMs: () => now }, scheduler,
    });
    controller.activate();
    await controller.refresh();
    expect(scheduler.schedule).toHaveBeenCalledOnce();
    now = 3_500;
    callback?.();
    expect(controller.getSnapshot()).toMatchObject({ remainingMs: 1_497_500, displaySeconds: 1_498 });
    controller.setAppVisible(false);
    expect(cancel).toHaveBeenCalled();
    now = 10_000;
    controller.setAppVisible(true);
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({ remainingMs: 1_491_000 });
    controller.deactivate();
  });

  it('projects exact deadline as pending without scheduling another tick', async () => {
    const deps = dependencies(1_501_000);
    const controller = new StandardFocusSessionController(deps);
    controller.activate();
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0,
    });
    expect(deps.scheduler.schedule).not.toHaveBeenCalled();
  });

  it('projects Strict through the same timestamp countdown', async () => {
    const deps = dependencies(2_000, 'strict');
    const controller = new StandardFocusSessionController(deps);
    controller.activate();
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', phase: 'running', mode: 'strict', sessionId: 'focus-1',
    });
    expect(deps.scheduler.schedule).toHaveBeenCalledOnce();
  });

  it('coalesces concurrent reads and publishes missing for another valid branch', async () => {
    let resolve!: (value: { ok: true; value: null }) => void;
    const read = vi.fn(() => new Promise<{ ok: true; value: null }>((done) => { resolve = done; }));
    const controller = new StandardFocusSessionController({
      clock: { nowMs: () => 2_000 }, scheduler: { schedule: vi.fn() },
      sessions: { findActive: read },
    });
    const first = controller.refresh();
    const second = controller.refresh();
    expect(first).toBe(second);
    resolve({ ok: true, value: null });
    await first;
    expect(read).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({ status: 'missing' });
  });

  it('fails closed for malformed Standard truth and read failures', async () => {
    const malformed = { ...runningStandard(), workTag: null };
    const invalid = new StandardFocusSessionController({
      clock: { nowMs: () => 2_000 }, scheduler: { schedule: vi.fn() },
      sessions: { findActive: async () => ({ ok: true, value: malformed }) },
    });
    await invalid.refresh();
    expect(invalid.getSnapshot()).toMatchObject({
      status: 'error', error: { code: 'STANDARD_FOCUS_STATE_INVALID' },
    });
    const failed = new StandardFocusSessionController({
      clock: { nowMs: () => 2_000 }, scheduler: { schedule: vi.fn() },
      sessions: { findActive: async () => { throw new Error('offline'); } },
    });
    await failed.refresh();
    expect(failed.getSnapshot()).toMatchObject({
      status: 'error', error: { code: 'STANDARD_FOCUS_READ_FAILED' },
    });
  });
});
