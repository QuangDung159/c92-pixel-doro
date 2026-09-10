import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import type { BreakCompletionNotificationPort } from '../notifications';
import { BreakSideEffectCoordinator } from './break-side-effect.coordinator';

const running = (): RunningSessionRecord => ({
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-10', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

const notifications = (permission: 'allowed' | 'undetermined' = 'undetermined') => ({
  prepare: vi.fn(async () => ({ ok: true as const, value: undefined })),
  readPermission: vi.fn(async () => ({ ok: true as const, value: permission })),
  requestPermission: vi.fn(async () => ({ ok: true as const, value: 'allowed' as const })),
  ensure: vi.fn(async () => ({ ok: true as const, value: 'scheduled' as const })),
  cancel: vi.fn(async () => ({ ok: true as const, value: 'cancelled' as const })),
}) satisfies BreakCompletionNotificationPort;

describe('BreakSideEffectCoordinator', () => {
  it('records a fresh start and requests permission only from explicit Start', async () => {
    const native = notifications();
    const analytics = { recordStarted: vi.fn(async () => undefined),
      recordCompleted: vi.fn(async () => undefined) };
    const subject = new BreakSideEffectCoordinator({
      analytics, notifications: native,
      readSettings: () => ({ analyticsEnabled: true, notificationsEnabled: true,
        soundEnabled: true }), loadSession: vi.fn(),
    });
    subject.afterStarted(running());
    await subject.whenIdle();
    expect(analytics.recordStarted).toHaveBeenCalledWith(running());
    expect(native.requestPermission).toHaveBeenCalledOnce();
    expect(native.ensure).toHaveBeenCalledWith({
      kind: 'break_completion', operationKey: 'break-complete:break-1',
      sessionId: 'break-1', endsAt: 301_000, soundEnabled: true,
      breakType: 'short_break',
    });
  });

  it('never prompts during startup recovery and still restores an allowed schedule', async () => {
    const native = notifications('allowed');
    const subject = new BreakSideEffectCoordinator({
      analytics: { recordStarted: vi.fn(), recordCompleted: vi.fn() },
      notifications: native, readSettings: () => ({ analyticsEnabled: true,
        notificationsEnabled: true, soundEnabled: false }), loadSession: vi.fn(),
    });
    subject.ensureRunning(running());
    await subject.whenIdle();
    expect(native.requestPermission).not.toHaveBeenCalled();
    expect(native.ensure).toHaveBeenCalledOnce();
  });

  it('cancels all terminal keys but records only a fresh completion', async () => {
    const native = notifications();
    const completed = { status: 'completed' as const, sessionId: 'break-1',
      kind: 'short' as const, durationMinutes: 5 as const, startedAt: 1_000,
      endsAt: 301_000, resolvedAt: 301_000 };
    const analytics = { recordStarted: vi.fn(), recordCompleted: vi.fn(async () => undefined) };
    const loadSession = vi.fn(async () => completed);
    const subject = new BreakSideEffectCoordinator({ analytics, notifications: native,
      readSettings: () => null, loadSession });
    subject.afterTerminal('break-1', 'completed', 'fresh_commit');
    await subject.whenIdle();
    expect(native.cancel).toHaveBeenCalledWith('break-complete:break-1');
    expect(analytics.recordCompleted).toHaveBeenCalledWith(completed);
    subject.afterTerminal('break-1', 'cancelled', 'fresh_commit');
    subject.afterTerminal('break-1', 'completed', 'existing_terminal');
    await subject.whenIdle();
    expect(loadSession).toHaveBeenCalledOnce();
    expect(analytics.recordCompleted).toHaveBeenCalledOnce();
  });
});
