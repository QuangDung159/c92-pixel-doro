import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  RunningSessionRecord,
  StandardFocusCompletedResult,
} from '@pixeldoro/application';

import {
  StandardFocusAnalyticsRecorder,
  type AppLifecycleState,
  type FocusCompletionNotificationError,
  type FocusNotificationResponse,
} from '@/application';
import { createMobileApplication } from '@/composition/create-mobile-application';
import { HostDriver, now, openDatabase } from '../support/standard-focus-sqlite';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

const running = (): RunningSessionRecord => ({
  id: 'focus-side-effect-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: now, endsAt: now + 900_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-07', scheduledEndUtcOffsetMinutes: 420,
  createdAt: now, updatedAt: now,
});

const completed = (): StandardFocusCompletedResult => ({
  sessionId: 'focus-side-effect-1', durationMinutes: 15, mode: 'relax', workTag: 'study',
  startedAt: now, endsAt: now + 900_000, resolvedAt: now + 900_000,
  status: 'completed', receiptId: 'reward-side-effect-1',
  rewardClaimedAt: now + 900_000, xpEarned: 15, coinsEarned: 3,
  totalXp: 15, coinBalance: 3,
});

describe('US-06-05 Standard side-effect SQLite integration', () => {
  it('persists deterministic Standard analytics in the existing bounded queue', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0605-analytics-'));
    temporaryDirectories.push(directory);
    const database = await openDatabase(new HostDriver(directory), 'side-effects.db');
    const recorder = new StandardFocusAnalyticsRecorder({
      isCaptureEnabled: () => true,
      queue: database.graph.analyticsQueue,
    });

    expect(await recorder.recordStarted(running())).toMatchObject({ ok: true });
    expect(await recorder.recordTerminal(completed())).toMatchObject({ ok: true });
    expect(await database.graph.analyticsEvents.findById(
      'focus_session_started:focus-side-effect-1',
    )).toMatchObject({
      ok: true,
      value: {
        eventName: 'focus_session_started',
        properties: { mode: 'relax', workTag: 'study', durationMinutes: 15 },
      },
    });
    expect(await database.graph.analyticsEvents.findById(
      'focus_session_completed:focus-side-effect-1',
    )).toMatchObject({ ok: true, value: { eventName: 'focus_session_completed' } });
    expect(await database.graph.analyticsEvents.findById(
      'reward_granted:reward-side-effect-1',
    )).toMatchObject({ ok: true, value: { eventName: 'reward_granted' } });

    expect(await recorder.recordStarted(running())).toMatchObject({ ok: true });
    const due = await database.graph.analyticsQueue.listDue(now + 900_001, 10);
    expect(due).toMatchObject({ ok: true });
    if (due.ok) expect(due.value).toHaveLength(3);
    await database.owner.close();
  });

  it('keeps committed Start successful when the notification provider throws', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0605-isolation-'));
    temporaryDirectories.push(directory);
    const providerError: FocusCompletionNotificationError = {
      kind: 'focus_completion_notification_error',
      code: 'NOTIFICATION_PERMISSION_FAILED',
    };
    const application = createMobileApplication({
      appLifecycle: { getCurrentState: () => 'active', subscribe: () => vi.fn() },
      clock: { nowMs: () => now },
      databaseName: 'isolation.db',
      diagnosticsEnabled: false,
      focusNotifications: {
        prepare: async () => ({ ok: true, value: undefined }),
        readPermission: async () => { throw new Error('native unavailable'); },
        requestPermission: async () => ({ ok: false, error: providerError }),
        ensure: async () => ({ ok: false, error: providerError }),
        cancel: async () => ({ ok: false, error: providerError }),
        readInitial: async () => null,
        subscribe: async () => () => undefined,
        clearInitial: async () => undefined,
        cancelKnownSession: async () => ({ ok: true, value: undefined }),
      },
      id: { nextId: () => 'focus-isolated' },
      localCalendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-07', utcOffsetMinutes: 420 },
      }) },
      sqliteDriver: new HostDriver(directory),
    });

    await application.boot();
    expect(await application.standardFocusSetup.start()).toMatchObject({
      ok: true,
      session: { id: 'focus-isolated', status: 'running' },
    });
    expect(await application.persistence.sessions.findActive()).toMatchObject({
      ok: true,
      value: { id: 'focus-isolated', status: 'running' },
    });
    expect(application.bootstrap.getSnapshot()).toMatchObject({ status: 'ready' });
    await application.dispose();
  });

  it('keeps warm notification tap and foreground reconciliation on one transaction queue', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0605-warm-tap-'));
    temporaryDirectories.push(directory);
    let currentNow = now;
    let lifecycleState: AppLifecycleState = 'active';
    const lifecycleListeners = new Set<(state: AppLifecycleState) => void>();
    let responseListener: ((response: FocusNotificationResponse) => void) | undefined;
    const application = createMobileApplication({
      appLifecycle: {
        getCurrentState: () => lifecycleState,
        subscribe: (listener) => {
          lifecycleListeners.add(listener);
          return () => lifecycleListeners.delete(listener);
        },
      },
      clock: { nowMs: () => currentNow },
      databaseName: 'warm-tap.db',
      diagnosticsEnabled: false,
      focusNotifications: {
        prepare: async () => ({ ok: true, value: undefined }),
        readPermission: async () => ({ ok: true, value: 'allowed' }),
        requestPermission: async () => ({ ok: true, value: 'allowed' }),
        ensure: async () => ({ ok: true, value: 'scheduled' }),
        cancel: async () => ({ ok: true, value: 'cancelled' }),
        readInitial: async () => null,
        subscribe: async (listener) => {
          responseListener = listener;
          return () => { responseListener = undefined; };
        },
        clearInitial: async () => undefined,
        cancelKnownSession: async () => ({ ok: true, value: undefined }),
      },
      id: { nextId: () => 'focus-warm-tap' },
      localCalendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-07', utcOffsetMinutes: 420 },
      }) },
      sqliteDriver: new HostDriver(directory),
    });

    await application.boot();
    const started = await application.standardFocusSetup.start();
    expect(started).toMatchObject({ ok: true, session: { id: 'focus-warm-tap' } });
    if (!started.ok) throw new Error('Expected Standard Focus to start');
    await vi.waitFor(() => expect(responseListener).toBeTypeOf('function'));

    lifecycleState = 'background';
    lifecycleListeners.forEach((listener) => listener('background'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    currentNow = started.session.endsAt;
    lifecycleState = 'active';
    lifecycleListeners.forEach((listener) => listener('active'));
    responseListener?.({
      responseId: 'warm-response-1',
      operationKey: 'standard-focus-complete:focus-warm-tap',
      kind: 'standard_focus_completion',
      sessionId: 'focus-warm-tap',
    });

    await vi.waitFor(() => {
      expect(application.bootstrap.getSnapshot().status).toBe('ready');
      expect(application.standardFocusNotificationNavigation.getSnapshot()).toMatchObject({
        status: 'pending',
        destination: 'result',
        sessionId: 'focus-warm-tap',
      });
    });
    expect(await application.persistence.sessions.findById('focus-warm-tap')).toMatchObject({
      ok: true,
      value: { status: 'completed' },
    });
    await application.dispose();
  });
});
