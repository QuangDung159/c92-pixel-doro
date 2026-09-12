import { describe, expect, it, vi } from 'vitest';

import type {
  AppSettingsPatch,
  AppSettingsRecord,
  SettingsControllerDependencies,
  SensoryFeedbackPort,
} from '@/application';
import { AnalyticsCaptureGate, SettingsController } from '@/application';

const initialSettings = (): AppSettingsRecord => ({
  id: 1,
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  defaultMode: 'relax',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  analyticsEnabled: true,
  createdAt: 1_000,
  updatedAt: 1_000,
});

const harness = () => {
  let record = initialSettings();
  let anonymousId = 'anonymous-old';
  const gate = new AnalyticsCaptureGate();
  const clear = vi.fn(async () => ({ ok: true as const, value: 2 }));
  const readPermission = vi.fn(async () => ({ ok: true as const, value: 'allowed' as const }));
  const requestPermission = vi.fn(async () => ({ ok: true as const, value: 'allowed' as const }));
  const sensory: SensoryFeedbackPort = {
    emit: vi.fn(async () => undefined),
    setActive: vi.fn(async () => undefined),
    dispose: vi.fn(async () => undefined),
  };
  const dependencies = {
    analyticsGate: gate,
    analyticsQueue: { clear },
    bootstrap: {
      getSnapshot: () => ({ status: 'ready' as const, snapshot: {
        migrationVersion: 1,
        installation: { installedAt: 1_000, onboardingCompletedAt: 1_000 },
        settings: record,
        profile: { totalXp: 0, coinBalance: 0 },
        catalog: [],
      } }),
      refreshReadySnapshot: vi.fn(async () => ({ ok: true as const, value: {} as never })),
    },
    clock: { nowMs: vi.fn(() => record.updatedAt + 1) },
    coordinator: { run: <T,>(work: () => Promise<T>) => work() },
    id: { nextId: vi.fn(() => 'anonymous-new') },
    installation: {
      find: vi.fn(async () => ({ ok: true as const, value: {
        id: 1 as const, installedAt: 1_000, onboardingCompletedAt: 1_000,
        anonymousAnalyticsId: anonymousId, createdAt: 1_000, updatedAt: 1_000,
      } })),
      setOnboardingCompleted: vi.fn(),
      setAnonymousAnalyticsId: vi.fn(async (id: string | null) => {
        anonymousId = id ?? '';
        return { ok: true as const, value: 'updated' as const };
      }),
    },
    notifications: {
      prepare: vi.fn(async () => ({ ok: true as const, value: undefined })),
      readPermission,
      requestPermission,
      ensure: vi.fn(async () => ({ ok: true as const, value: 'scheduled' as const })),
      cancel: vi.fn(async () => ({ ok: true as const, value: 'already_absent' as const })),
      cancelKnownSession: vi.fn(async () => ({ ok: true as const, value: undefined })),
    },
    openSystemSettings: vi.fn(async () => undefined),
    reset: vi.fn(async () => {
      record = initialSettings();
      return { ok: true as const, value: {} as never };
    }),
    sensory,
    sessions: { findActive: vi.fn(async () => ({ ok: true as const, value: null })) },
    settings: {
      find: vi.fn(async () => ({ ok: true as const, value: record })),
      patch: vi.fn(async (patch: AppSettingsPatch) => {
        const { updatedAt, ...changed } = patch;
        record = { ...record, ...changed, updatedAt };
        return { ok: true as const, value: 'updated' as const };
      }),
      replace: vi.fn(),
    },
  } satisfies SettingsControllerDependencies;
  const controller = new SettingsController(dependencies);
  return {
    controller, dependencies, gate, clear, readPermission, requestPermission,
    record: () => record, anonymousId: () => anonymousId,
  };
};

describe('SettingsController', () => {
  it('loads durable settings and serializes independent immediate patches', async () => {
    const fixture = harness();
    await fixture.controller.activate();
    await Promise.all([
      fixture.controller.setFocusDuration(50),
      fixture.controller.setDefaultMode('strict'),
      fixture.controller.setSoundEnabled(false),
    ]);

    expect(fixture.record()).toMatchObject({
      focusDurationMinutes: 50,
      defaultMode: 'strict',
      soundEnabled: false,
      hapticsEnabled: true,
      analyticsEnabled: true,
    });
    expect(fixture.controller.getSnapshot()).toMatchObject({
      status: 'ready',
      busy: [],
      issue: null,
    });
  });

  it('persists the latest value when a local setting is changed repeatedly', async () => {
    const fixture = harness();
    await fixture.controller.activate();

    await Promise.all([
      fixture.controller.setSoundEnabled(false),
      fixture.controller.setSoundEnabled(true),
    ]);

    expect(fixture.record().soundEnabled).toBe(true);
    expect(fixture.dependencies.settings.patch).toHaveBeenNthCalledWith(
      1, expect.objectContaining({ soundEnabled: false }),
    );
    expect(fixture.dependencies.settings.patch).toHaveBeenNthCalledWith(
      2, expect.objectContaining({ soundEnabled: true }),
    );
    expect(fixture.controller.getSnapshot()).toMatchObject({ busy: [] });
  });

  it('commits analytics off before clearing and rotating identity', async () => {
    const fixture = harness();
    await fixture.controller.activate();
    expect(await fixture.controller.setAnalyticsEnabled(false)).toBe(true);

    expect(fixture.record().analyticsEnabled).toBe(false);
    expect(fixture.clear).toHaveBeenCalledOnce();
    expect(fixture.anonymousId()).toBe('anonymous-new');
    expect(fixture.gate.isEnabled(true)).toBe(false);
  });

  it('does not repeat completed privacy cleanup when Settings is reopened in one runtime', async () => {
    const fixture = harness();
    await fixture.controller.activate();
    expect(await fixture.controller.setAnalyticsEnabled(false)).toBe(true);
    fixture.controller.deactivate();

    await fixture.controller.activate();
    await Promise.resolve();

    expect(fixture.dependencies.installation.setAnonymousAnalyticsId).toHaveBeenCalledOnce();
    expect(fixture.clear).toHaveBeenCalledOnce();
  });

  it('keeps capture blocked and exposes retry when analytics cleanup fails', async () => {
    const fixture = harness();
    fixture.clear.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'persistence_error', code: 'PERSISTENCE_WRITE_FAILED', entity: 'analytics_events', field: null },
    } as never);
    await fixture.controller.activate();
    expect(await fixture.controller.setAnalyticsEnabled(false)).toBe(false);
    expect(fixture.record().analyticsEnabled).toBe(false);
    expect(fixture.gate.isEnabled(true)).toBe(false);
    expect(fixture.controller.getSnapshot()).toMatchObject({
      status: 'ready', issue: 'ANALYTICS_CLEANUP_REQUIRED',
    });
    expect(await fixture.controller.retry()).toBe(true);
    expect(fixture.anonymousId()).toBe('anonymous-new');
  });

  it('keeps notification preference on when the OS denies permission', async () => {
    const fixture = harness();
    fixture.readPermission.mockResolvedValue({ ok: true, value: 'undetermined' } as never);
    fixture.requestPermission.mockResolvedValue({ ok: true, value: 'denied' } as never);
    await fixture.controller.activate();
    expect(await fixture.controller.setNotificationsEnabled(true)).toBe(true);
    expect(fixture.record().notificationsEnabled).toBe(true);
    expect(fixture.controller.getSnapshot()).toMatchObject({
      status: 'ready', notificationPermission: 'denied', issue: 'NOTIFICATION_OS_BLOCKED',
    });
  });

  it('turns notifications off without reading or requesting OS permission', async () => {
    const fixture = harness();
    await fixture.controller.activate();
    await Promise.resolve();
    fixture.readPermission.mockClear();
    fixture.requestPermission.mockClear();

    expect(await fixture.controller.setNotificationsEnabled(false)).toBe(true);

    expect(fixture.record().notificationsEnabled).toBe(false);
    expect(fixture.readPermission).not.toHaveBeenCalled();
    expect(fixture.requestPermission).not.toHaveBeenCalled();
    expect(fixture.dependencies.notifications.cancelKnownSession).toHaveBeenCalledOnce();
  });

  it('ignores a permission read that finishes after the screen deactivates', async () => {
    const fixture = harness();
    let resolvePermission!: (value: { ok: true; value: 'allowed' }) => void;
    const pendingPermission = new Promise<{ ok: true; value: 'allowed' }>((resolve) => {
      resolvePermission = resolve;
    });
    fixture.readPermission.mockImplementationOnce(() => pendingPermission);

    await fixture.controller.activate();
    fixture.controller.deactivate();
    resolvePermission({ ok: true, value: 'allowed' });
    await pendingPermission;
    await Promise.resolve();

    expect(fixture.controller.getSnapshot()).toMatchObject({
      status: 'ready', notificationPermission: 'checking', issue: null,
    });
  });

  it('runs confirmed reset with haptic intent and restores defaults', async () => {
    const fixture = harness();
    await fixture.controller.activate();
    await fixture.controller.setFocusDuration(50);
    expect(await fixture.controller.resetAllLocalData()).toBe(true);
    expect(fixture.record().focusDurationMinutes).toBe(25);
    expect(fixture.dependencies.sensory.emit).toHaveBeenCalledWith(
      'destructive_confirmation', expect.anything(), expect.stringMatching(/^reset:/),
    );
  });

  it('keeps destructive reset single-flight', async () => {
    const fixture = harness();
    await fixture.controller.activate();

    const first = fixture.controller.resetAllLocalData();
    const duplicate = fixture.controller.resetAllLocalData();

    expect(duplicate).toBe(first);
    expect(await first).toBe(true);
    expect(fixture.dependencies.reset).toHaveBeenCalledOnce();
  });
});
