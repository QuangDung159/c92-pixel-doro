import {
  persistenceError,
  type SessionRecord,
} from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import type { InstallationRecord } from '../persistence';
import { FirstUseEntryController } from './first-use-entry.controller';

const timestamp = 1_788_115_200_000;

const installation = (
  onboardingCompletedAt: number | null = null,
): InstallationRecord => ({
  id: 1,
  installedAt: timestamp,
  onboardingCompletedAt,
  anonymousAnalyticsId: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const trial = (status: SessionRecord['status']): SessionRecord => ({
  id: `trial-${status}`,
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'onboarding_trial',
  mode: 'relax',
  status,
  workTag: null,
  configuredDurationMinutes: 5,
  startedAt: timestamp,
  endsAt: timestamp + 300_000,
  backgroundedAt: null,
  resolvedAt: status === 'running' ? null : timestamp + 300_000,
  xpEarned: status === 'completed' ? 5 : 0,
  coinsEarned: status === 'completed' ? 1 : 0,
  rewardClaimedAt: status === 'completed' ? timestamp + 300_000 : null,
  scheduledEndLocalDate: '2026-08-31',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createController = (
  installationRecord: InstallationRecord | null,
  sessionRecord: SessionRecord | null,
  activeRecord: SessionRecord | null = null,
) => {
  const findInstallation = vi.fn(async () => ({
    ok: true as const,
    value: installationRecord,
  }));
  const findLatestOnboardingTrial = vi.fn(async () => ({
    ok: true as const,
    value: sessionRecord,
  }));
  const findActive = vi.fn(async () => ({
    ok: true as const,
    value: activeRecord,
  }));
  const controller = new FirstUseEntryController({
    installation: { find: findInstallation },
    sessions: { findActive, findLatestOnboardingTrial },
  });
  return { controller, findActive, findInstallation, findLatestOnboardingTrial };
};

describe('FirstUseEntryController', () => {
  it.each([
    [null, 'onboarding_intro'],
    [trial('running'), 'trial_running'],
    [trial('completed'), 'trial_result'],
    [trial('cancelled'), 'onboarding_intro'],
  ] as const)(
    'maps the latest onboarding trial to %s',
    async (sessionRecord, destination) => {
      const { controller } = createController(installation(), sessionRecord);

      expect(controller.getSnapshot()).toEqual({ status: 'idle' });
      await controller.refresh();

      expect(controller.getSnapshot()).toEqual({
        status: 'ready',
        destination,
      });
    },
  );

  it('routes completed onboarding Home after confirming there is no active session', async () => {
    const { controller, findActive, findLatestOnboardingTrial } = createController(
      installation(timestamp + 1),
      trial('running'),
    );

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'home',
    });
    expect(findActive).toHaveBeenCalledOnce();
    expect(findLatestOnboardingTrial).not.toHaveBeenCalled();
  });

  it('routes a fresh startup Strict failure to its exact Result before Home', async () => {
    const controller = new FirstUseEntryController({
      installation: {
        find: async () => ({ ok: true, value: installation(timestamp + 1) }),
      },
      sessions: {
        findActive: vi.fn(),
        findLatestOnboardingTrial: vi.fn(),
      },
      standardOutcome: {
        getSnapshot: () => ({ status: 'failed', sessionId: 'strict-1' }),
      },
    });
    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', destination: 'standard_focus_result', sessionId: 'strict-1',
    });
  });

  it('routes completed onboarding to the committed running Standard Focus', async () => {
    const standard: SessionRecord = {
      ...trial('running'),
      id: 'focus-1',
      focusVariant: 'standard',
      workTag: 'coding',
      configuredDurationMinutes: 25,
      endsAt: timestamp + 1_500_000,
    };
    const { controller } = createController(
      installation(timestamp + 1),
      null,
      standard,
    );

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'standard_focus_running',
    });
  });

  it('fails closed for missing installation and impossible trial state', async () => {
    const missing = createController(null, null).controller;
    await missing.refresh();
    expect(missing.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_STATE_INVALID' },
    });

    const failed = createController(installation(), trial('failed')).controller;
    await failed.refresh();
    expect(failed.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_STATE_INVALID' },
    });

    const standard = createController(installation(), {
      ...trial('running'),
      focusVariant: 'standard',
      workTag: 'coding',
      configuredDurationMinutes: 25,
      endsAt: timestamp + 1_500_000,
    }).controller;
    await standard.refresh();
    expect(standard.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_STATE_INVALID' },
    });
  });

  it('maps repository failures and thrown errors without leaking details', async () => {
    const installationFailure = new FirstUseEntryController({
      installation: {
        find: async () => ({
          ok: false,
          error: persistenceError(
            'PERSISTENCE_QUERY_FAILED',
            'app_installation',
          ),
        }),
      },
      sessions: { findActive: vi.fn(), findLatestOnboardingTrial: vi.fn() },
    });
    await installationFailure.refresh();
    expect(installationFailure.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_READ_FAILED' },
    });

    const sessionFailure = new FirstUseEntryController({
      installation: { find: async () => ({ ok: true, value: installation() }) },
      sessions: {
        findActive: vi.fn(),
        findLatestOnboardingTrial: async () => {
          throw new Error('sqlite raw provider detail');
        },
      },
    });
    await sessionFailure.refresh();
    expect(sessionFailure.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_READ_FAILED' },
    });
    expect(JSON.stringify(sessionFailure.getSnapshot())).not.toContain('sqlite');
  });

  it('single-flights refresh and notifies subscribers for loading and ready', async () => {
    let resolveInstallation:
      | ((value: { readonly ok: true; readonly value: InstallationRecord }) => void)
      | undefined;
    const find = vi.fn(() => new Promise<{
      readonly ok: true;
      readonly value: InstallationRecord;
    }>((resolve) => {
      resolveInstallation = resolve;
    }));
    const controller = new FirstUseEntryController({
      installation: { find },
      sessions: {
        findActive: async () => ({ ok: true, value: null }),
        findLatestOnboardingTrial: vi.fn(),
      },
    });
    const listener = vi.fn();
    controller.subscribe(listener);

    const first = controller.refresh();
    const second = controller.refresh();
    expect(first).toBe(second);
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    expect(find).toHaveBeenCalledOnce();

    resolveInstallation?.({ ok: true, value: installation(timestamp + 1) });
    await first;
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'home',
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('supports retry after failure and ignores late work after dispose', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        error: persistenceError('PERSISTENCE_QUERY_FAILED', 'app_installation'),
      })
      .mockResolvedValueOnce({ ok: true, value: installation(timestamp + 1) });
    const retryable = new FirstUseEntryController({
      installation: { find },
      sessions: {
        findActive: async () => ({ ok: true, value: null }),
        findLatestOnboardingTrial: vi.fn(),
      },
    });
    await retryable.refresh();
    await retryable.refresh();
    expect(retryable.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'home',
    });

    let resolveLate:
      | ((value: { readonly ok: true; readonly value: InstallationRecord }) => void)
      | undefined;
    const late = new FirstUseEntryController({
      installation: {
        find: () => new Promise((resolve) => {
          resolveLate = resolve;
        }),
      },
      sessions: { findActive: vi.fn(), findLatestOnboardingTrial: vi.fn() },
    });
    const listener = vi.fn();
    late.subscribe(listener);
    const operation = late.refresh();
    late.dispose();
    resolveLate?.({ ok: true, value: installation(timestamp + 1) });
    await operation;
    expect(listener).toHaveBeenCalledOnce();
    expect(late.getSnapshot()).toEqual({ status: 'loading' });
  });
});
