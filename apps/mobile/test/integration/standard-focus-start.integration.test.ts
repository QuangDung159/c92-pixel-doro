import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CancelStandardFocusUseCase,
  LoadStandardFocusResultUseCase,
  RecordStrictBackgroundUseCase,
  ReconcileStandardFocusUseCase,
  SessionCommandCoordinator,
  StartStandardFocusUseCase,
} from '@pixeldoro/application';

import {
  FirstUseEntryController,
  StandardFocusSessionController,
} from '@/application';
import { HostDriver, openDatabase, now } from '../support/standard-focus-sqlite';
import { createMobileApplication } from '@/composition/create-mobile-application';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('Standard Focus Start SQLite integration', () => {
  it('commits Relax cancel, preserves zero reward and reloads the exact Result', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0602-cancel-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus-cancel.db';
    const first = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now }, coordinator,
      id: { nextId: () => 'relax-1' }, sessions: first.graph.sessions,
      transaction: first.transaction,
    });
    expect(await start.execute({
      durationMinutes: 15, mode: 'relax', workTag: 'coding',
    })).toMatchObject({ ok: true, value: { session: { id: 'relax-1' } } });
    const profileBefore = await first.graph.profile.find();
    const cancel = new CancelStandardFocusUseCase({
      clock: { nowMs: () => now + 1_000 }, coordinator,
      sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await cancel.execute('relax-1')).toEqual({
      ok: true, value: { outcome: 'cancelled', sessionId: 'relax-1' },
    });
    expect(await first.graph.sessions.findActive()).toEqual({ ok: true, value: null });
    expect(await first.graph.rewards.findBySessionId('relax-1')).toEqual({ ok: true, value: null });
    expect(await first.graph.profile.find()).toEqual(profileBefore);
    expect(await cancel.execute('relax-1')).toEqual({
      ok: true, value: { outcome: 'already_cancelled', sessionId: 'relax-1' },
    });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const loadResult = new LoadStandardFocusResultUseCase({
      sessions: reopened.graph.sessions,
      profile: reopened.graph.profile, rewards: reopened.graph.rewards, transaction: reopened.transaction,
    });
    expect(await loadResult.execute('relax-1')).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          sessionId: 'relax-1', mode: 'relax', workTag: 'coding',
          durationMinutes: 15, resolvedAt: now + 1_000, xpEarned: 0, coinsEarned: 0,
        },
      },
    });
    expect(await loadResult.execute('other')).toEqual({
      ok: true, value: { outcome: 'missing' },
    });
    await reopened.owner.close();
  });

  it('commits once, survives reopen, restores Session and routes cold entry', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0601-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus.db';
    const first = await openDatabase(driver, databaseName);
    let id = 0;
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => `focus-${++id}` },
      sessions: first.graph.sessions,
      transaction: first.transaction,
    });

    const started = await start.execute({
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
    });
    expect(started).toMatchObject({
      ok: true,
      value: {
        outcome: 'started',
        session: {
          id: 'focus-1',
          focusVariant: 'standard',
          mode: 'strict',
          workTag: 'study',
          endsAt: now + 1_500_000,
        },
      },
    });
    expect(await start.execute({
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
    })).toMatchObject({
      ok: false,
      error: { code: 'SESSION_START_CONFLICT' },
    });
    expect(await first.graph.installation.setOnboardingCompleted(now - 1, now - 1))
      .toMatchObject({ ok: true, value: 'updated' });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const session = new StandardFocusSessionController({
      clock: { nowMs: () => now },
      scheduler: { schedule: () => () => undefined },
      sessions: reopened.graph.sessions,
    });
    await session.refresh();
    expect(session.getSnapshot()).toEqual({
      status: 'ready',
      phase: 'running',
      sessionId: 'focus-1',
      durationMinutes: 25,
      mode: 'strict',
      workTag: 'study',
      startedAt: now,
      endsAt: now + 1_500_000,
      remainingMs: 1_500_000,
      displaySeconds: 1_500,
    });
    const entry = new FirstUseEntryController({
      installation: reopened.graph.installation,
      sessions: reopened.graph.sessions,
    });
    await entry.refresh();
    expect(entry.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'standard_focus_running',
    });
    await reopened.owner.close();
  });

  it('persists Strict episodes, clears a safe return and commits a proven failure once', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0603-strict-'));
    temporaryDirectories.push(directory);
    const driver = new HostDriver(directory);
    const databaseName = 'standard-focus-strict.db';
    const first = await openDatabase(driver, databaseName);
    const coordinator = new SessionCommandCoordinator();
    const start = new StartStandardFocusUseCase({
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => now }, coordinator,
      id: { nextId: () => 'strict-1' }, sessions: first.graph.sessions,
      transaction: first.transaction,
    });
    expect(await start.execute({
      durationMinutes: 15, mode: 'strict', workTag: 'study',
    })).toMatchObject({ ok: true, value: { session: { id: 'strict-1' } } });
    const record = new RecordStrictBackgroundUseCase({
      coordinator, sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await record.execute(now + 1_000)).toMatchObject({
      ok: true, value: { outcome: 'recorded' },
    });
    let reconcileNow = now + 10_999;
    const reconcile = new ReconcileStandardFocusUseCase({
      clock: { nowMs: () => reconcileNow }, coordinator,
      id: { nextId: () => 'receipt' }, profile: first.graph.profile, rewards: first.graph.rewards,
      sessions: first.graph.sessions, transaction: first.transaction,
    });
    expect(await reconcile.execute()).toMatchObject({
      ok: true, value: { outcome: 'safe_episode_cleared' },
    });
    expect(await first.graph.sessions.findActive()).toMatchObject({
      ok: true, value: { id: 'strict-1', backgroundedAt: null, status: 'running' },
    });

    expect(await record.execute(now + 20_000)).toMatchObject({
      ok: true, value: { outcome: 'recorded' },
    });
    reconcileNow = now + 30_000;
    expect(await reconcile.execute()).toEqual({
      ok: true,
      value: {
        outcome: 'failed', sessionId: 'strict-1',
        freshness: 'fresh_commit', resolvedAt: now + 30_000,
      },
    });
    expect(await first.graph.sessions.findActive()).toEqual({ ok: true, value: null });
    expect(await first.graph.rewards.findBySessionId('strict-1')).toEqual({
      ok: true, value: null,
    });
    expect(await reconcile.execute('strict-1')).toMatchObject({
      ok: true,
      value: { outcome: 'failed', freshness: 'existing_terminal' },
    });
    await first.owner.close();

    const reopened = await openDatabase(driver, databaseName);
    const result = new LoadStandardFocusResultUseCase({
      sessions: reopened.graph.sessions,
      profile: reopened.graph.profile, rewards: reopened.graph.rewards, transaction: reopened.transaction,
    });
    expect(await result.execute('strict-1')).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          status: 'failed', mode: 'strict', sessionId: 'strict-1',
          backgroundedAt: now + 20_000, xpEarned: 0, coinsEarned: 0,
        },
      },
    });
    await reopened.owner.close();
  });

  it('uses the dev-only CTA operation to confirmed-reset local data and return first use', async () => {
    vi.stubGlobal('__DEV__', true);
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0601-reset-'));
    temporaryDirectories.push(directory);
    let id = 0;
    const application = createMobileApplication({
      appLifecycle: {
        getCurrentState: () => 'active',
        subscribe: () => vi.fn(),
      },
      clock: { nowMs: () => now },
      databaseName: 'standard-focus-reset.db',
      id: { nextId: () => `review-${++id}` },
      localCalendar: { snapshot: () => ({
        ok: true,
        value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      sqliteDriver: new HostDriver(directory),
    });

    await application.boot();
    expect(application.standardFocusReviewResetAvailable).toBe(true);
    expect(await application.standardFocusSetup.start()).toMatchObject({ ok: true });
    expect(await application.persistence.sessions.findActive()).toMatchObject({
      ok: true,
      value: { focusVariant: 'standard', status: 'running' },
    });

    expect(await application.resetStandardFocusReviewData()).toBe(true);
    expect(await application.persistence.sessions.findActive()).toEqual({
      ok: true,
      value: null,
    });
    expect(application.firstUseEntry.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'onboarding_intro',
    });
    await application.dispose();
  });
});
