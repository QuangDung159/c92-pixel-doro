import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { AppLifecyclePort, MobileApplicationFacade } from '@/application';
import { FakeSQLiteDriver } from '../../test/fakes/fake-sqlite-driver';

import {
  completeEpic02ExitProbe,
  runEpic02ExitProbe,
} from './diagnostics/run-epic-02-exit-probe';
import { createMobileApplication } from './create-mobile-application';

vi.mock('./diagnostics/run-epic-02-exit-probe', () => ({
  runEpic02ExitProbe: vi.fn(),
  completeEpic02ExitProbe: vi.fn(),
}));

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

afterEach(() => {
  delete process.env.EXPO_PUBLIC_EPIC_02_EXIT_PROBE;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('mobile composition root', () => {
  it('keeps confirmed reset outside the current Presentation facade', () => {
    expectTypeOf<MobileApplicationFacade>().not.toHaveProperty('confirmedReset');
  });

  it('boots and disposes one application-scoped graph', async () => {
    const driver = new FakeSQLiteDriver();
    const appLifecycle: AppLifecyclePort = {
      getCurrentState: () => 'active',
      subscribe: () => vi.fn(),
    };
    const application = createMobileApplication({
      appLifecycle,
      sqliteDriver: driver,
      migration: {
        migrate: async () => ({
          ok: true,
          value: { fromVersion: 0, toVersion: 1, appliedVersions: [1] },
        }),
      },
      bootstrapVerifier: {
        verify: async () => ({ ok: true, value: undefined }),
      },
      bootstrapData: {
        read: async () => ({
          ok: true,
          value: {
            migrationVersion: 1,
            installation: { installedAt: 42, onboardingCompletedAt: null },
            settings: {
              focusDurationMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 15,
              defaultMode: 'relax',
              soundEnabled: true,
              hapticsEnabled: true,
              notificationsEnabled: true,
              analyticsEnabled: true,
            },
            profile: { totalXp: 0, coinBalance: 0 },
            catalog: [],
          },
        }),
      },
      startupReconciliation: {
        reconcileAtStartup: async () => ({ ok: true, value: undefined }),
      },
    });

    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'idle' });

    await application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    expect(application.readiness.run(() => 'safe')).toEqual({
      ok: true,
      value: 'safe',
    });

    await application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');

    await application.dispose();
    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'disposed' });
    expect(application.readiness.run(() => 'unsafe')).toMatchObject({
      ok: false,
      error: { code: 'CORE_COMMANDS_NOT_READY' },
    });
    expect(driver.openCalls).toBe(1);
    expect(driver.connection.closeCalls).toBe(1);
  });

  it('publishes aggregate exit success only after the normal bootstrap reaches ready', async () => {
    process.env.EXPO_PUBLIC_EPIC_02_EXIT_PROBE = '1';
    vi.stubGlobal('__DEV__', true);
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const candidate = {
      probe: 'US-02-09_EPIC_EXIT' as const,
      kind: 'completion_candidate' as const,
      platform: 'ios',
      osVersion: '26.5',
      targetKind: 'simulator' as const,
      appVersion: '0.1.0',
      runtimeVersion: '0.1.0',
      applicationId: 'com.dragonc92team.pixeldoro',
      commitSha: '0123456789abcdef0123456789abcdef01234567',
      sqliteVersion: '3.50.3',
      physicalDiskFullStatus: 'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC' as const,
      componentProbes: [] as const,
      assertions: [] as const,
    };
    const finalReport = {
      ...candidate,
      kind: undefined,
      passed: true as const,
      phase: 'completed_after_relaunch' as const,
      assertions: [
        'normal_boot_reached_ready_after_exit_probe',
        'probe_connections_closed_and_databases_cleaned',
      ],
    };
    vi.mocked(runEpic02ExitProbe).mockResolvedValue(candidate);
    vi.mocked(completeEpic02ExitProbe).mockResolvedValue(finalReport);

    const driver = new FakeSQLiteDriver();
    const application = createMobileApplication({
      sqliteDriver: driver,
      migration: {
        migrate: async () => ({
          ok: true,
          value: { fromVersion: 1, toVersion: 1, appliedVersions: [] },
        }),
      },
      bootstrapVerifier: {
        verify: async () => ({ ok: true, value: undefined }),
      },
      bootstrapData: {
        read: async () => ({
          ok: true,
          value: {
            migrationVersion: 1,
            installation: { installedAt: 42, onboardingCompletedAt: null },
            settings: {
              focusDurationMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 15,
              defaultMode: 'relax',
              soundEnabled: true,
              hapticsEnabled: true,
              notificationsEnabled: true,
              analyticsEnabled: true,
            },
            profile: { totalXp: 0, coinBalance: 0 },
            catalog: [],
          },
        }),
      },
      startupReconciliation: {
        reconcileAtStartup: async () => ({ ok: true, value: undefined }),
      },
    });

    await application.boot();

    expect(application.bootstrap.getSnapshot().status).toBe('ready');
    expect(runEpic02ExitProbe).toHaveBeenCalledWith(driver);
    expect(completeEpic02ExitProbe).toHaveBeenCalledWith(
      driver,
      candidate,
      true,
    );
    expect(consoleInfo).toHaveBeenCalledWith(
      '[PixelDoro][Epic02ExitProbe]',
      JSON.stringify(finalReport),
    );
  });
});
