import { describe, expect, it, vi } from 'vitest';

import type { AppLifecyclePort } from '@/application';
import { FakeSQLiteDriver } from '../../test/fakes/fake-sqlite-driver';

import { createMobileApplication } from './create-mobile-application';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
}));

describe('mobile composition root', () => {
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
});
