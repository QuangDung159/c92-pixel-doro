import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord, StandardFocusTerminalResult } from '@pixeldoro/application';

import type {
  FocusCompletionNotificationPort,
  FocusNotificationResponse,
  FocusNotificationResponseSource,
} from '../notifications';
import { StandardFocusSideEffectCoordinator } from './standard-focus-side-effect.coordinator';

const running = (): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-07', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});
const cancelled = (): StandardFocusTerminalResult => ({
  sessionId: 'focus-1', durationMinutes: 15, mode: 'relax', workTag: 'study',
  startedAt: 1_000, endsAt: 901_000, resolvedAt: 500_000,
  status: 'cancelled', xpEarned: 0, coinsEarned: 0,
});

const notificationPort = () => ({
  prepare: vi.fn(async () => ({ ok: true as const, value: undefined })),
  readPermission: vi.fn(async () => ({ ok: true as const, value: 'undetermined' as const })),
  requestPermission: vi.fn(async () => ({ ok: true as const, value: 'allowed' as const })),
  ensure: vi.fn(async () => ({ ok: true as const, value: 'scheduled' as const })),
  cancel: vi.fn(async () => ({ ok: true as const, value: 'cancelled' as const })),
}) satisfies FocusCompletionNotificationPort;

const responseSource = (initial: FocusNotificationResponse | null = null) => {
  let listener: ((response: FocusNotificationResponse) => void) | undefined;
  return {
    source: {
      readInitial: vi.fn(async () => initial),
      subscribe: vi.fn(async (next) => { listener = next; return () => { listener = undefined; }; }),
      clearInitial: vi.fn(async () => undefined),
    } satisfies FocusNotificationResponseSource,
    emit: (response: FocusNotificationResponse) => listener?.(response),
  };
};

describe('StandardFocusSideEffectCoordinator', () => {
  it('requests permission contextually and runs started analytics independently', async () => {
    const notifications = notificationPort();
    const analytics = { recordStarted: vi.fn(async () => ({ ok: true as const, value: { outcome: 'recorded' as const, eventIds: [] } })),
      recordTerminal: vi.fn() };
    const responses = responseSource();
    const coordinator = new StandardFocusSideEffectCoordinator({
      analytics, notifications, responses: responses.source,
      readSettings: () => ({ analyticsEnabled: true, notificationsEnabled: true, soundEnabled: true }),
      loadResult: vi.fn(), onNotificationSession: vi.fn(),
    });
    coordinator.afterStarted(running());
    await coordinator.whenIdle();
    expect(analytics.recordStarted).toHaveBeenCalledWith(running());
    expect(notifications.requestPermission).toHaveBeenCalledOnce();
    expect(notifications.ensure).toHaveBeenCalledWith({
      operationKey: 'standard-focus-complete:focus-1',
      sessionId: 'focus-1', endsAt: 901_000, soundEnabled: true,
    });
  });

  it('does not prompt or schedule when notification preference is disabled', async () => {
    const notifications = notificationPort();
    const coordinator = new StandardFocusSideEffectCoordinator({
      analytics: { recordStarted: vi.fn(async () => ({
        ok: true as const,
        value: { outcome: 'skipped_disabled' as const },
      })), recordTerminal: vi.fn() },
      notifications, responses: responseSource().source,
      readSettings: () => ({ analyticsEnabled: true, notificationsEnabled: false, soundEnabled: true }),
      loadResult: vi.fn(), onNotificationSession: vi.fn(),
    });
    coordinator.afterStarted(running());
    await coordinator.whenIdle();
    expect(notifications.readPermission).not.toHaveBeenCalled();
    expect(notifications.ensure).not.toHaveBeenCalled();
  });

  it('cancels every terminal notification but records only fresh committed facts', async () => {
    const notifications = notificationPort();
    const terminal = cancelled();
    const analytics = { recordStarted: vi.fn(), recordTerminal: vi.fn(async () => ({ ok: true as const, value: { outcome: 'recorded' as const, eventIds: [] } })) };
    const loadResult = vi.fn(async () => ({ ok: true as const, value: { outcome: 'ready' as const, result: terminal } }));
    const coordinator = new StandardFocusSideEffectCoordinator({
      analytics, notifications, responses: responseSource().source,
      readSettings: () => ({ analyticsEnabled: true, notificationsEnabled: true, soundEnabled: true }),
      loadResult, onNotificationSession: vi.fn(),
    });
    coordinator.afterTerminal('focus-1', 'fresh_commit');
    await coordinator.whenIdle();
    expect(notifications.cancel).toHaveBeenCalledWith('standard-focus-complete:focus-1');
    expect(analytics.recordTerminal).toHaveBeenCalledWith(terminal);

    coordinator.afterTerminal('focus-1', 'existing_terminal');
    await coordinator.whenIdle();
    expect(loadResult).toHaveBeenCalledOnce();
    expect(analytics.recordTerminal).toHaveBeenCalledOnce();
  });

  it('dedupes warm/cold notification responses and clears accepted initial state', async () => {
    const response: FocusNotificationResponse = {
      responseId: 'response-1', operationKey: 'standard-focus-complete:focus-1',
      kind: 'standard_focus_completion', sessionId: 'focus-1',
    };
    const responses = responseSource(response);
    const onNotificationSession = vi.fn(async () => undefined);
    const coordinator = new StandardFocusSideEffectCoordinator({
      analytics: { recordStarted: vi.fn(), recordTerminal: vi.fn() },
      notifications: notificationPort(), responses: responses.source,
      readSettings: () => null, loadResult: vi.fn(), onNotificationSession,
    });
    coordinator.start();
    await coordinator.whenIdle();
    responses.emit(response);
    await coordinator.whenIdle();
    expect(onNotificationSession).toHaveBeenCalledTimes(1);
    expect(responses.source.clearInitial).toHaveBeenCalledOnce();
  });
});
