import { describe, expect, it, vi } from 'vitest';

import { OtaUpdateController } from './ota-update.controller';
import type { OtaRestartSafetyPort, OtaUpdatePort } from './ota-update.port';

const runtime = {
  appVersion: '1.0.1',
  enabled: true,
  channel: 'staging',
  runtimeVersion: '1.0.1',
  currentUpdateId: '11111111-1111-4111-8111-111111111111',
  isEmbeddedLaunch: false,
  otaNumber: '1789440000000',
};
const update = {
  kind: 'update' as const,
  updateId: '22222222-2222-4222-8222-222222222222',
};

const createHarness = (options: {
  now?: number;
  updates?: Partial<OtaUpdatePort>;
  safety?: OtaRestartSafetyPort;
} = {}) => {
  let now = options.now ?? 1_000;
  const updates: OtaUpdatePort = {
    getRuntimeInfo: async () => runtime,
    checkForUpdate: vi.fn(async () => ({ outcome: 'no_update' as const })),
    fetchUpdate: vi.fn(async () => ({ outcome: 'downloaded' as const, update })),
    reload: vi.fn(async () => undefined),
    ...options.updates,
  };
  const safety = options.safety ?? {
    evaluate: vi.fn(async () => ({ safe: true as const })),
  };
  const controller = new OtaUpdateController({
    clock: { nowMs: () => now },
    updates,
    restartSafety: safety,
  });
  return { controller, updates, safety, setNow: (value: number) => { now = value; } };
};

describe('OtaUpdateController', () => {
  it('is unavailable when Expo Updates is disabled or runtime is missing', async () => {
    const disabled = createHarness({
      updates: { getRuntimeInfo: async () => ({ ...runtime, enabled: false }) },
    });
    await disabled.controller.start();
    expect(disabled.controller.getSnapshot()).toMatchObject({
      status: 'unavailable', reason: 'disabled', runtime: { appVersion: '1.0.1' },
    });
    const missing = createHarness({
      updates: { getRuntimeInfo: async () => ({ ...runtime, runtimeVersion: null }) },
    });
    await missing.controller.start();
    expect(missing.controller.getSnapshot()).toMatchObject({
      status: 'unavailable', reason: 'runtime_missing', runtime: { appVersion: '1.0.1' },
    });
  });

  it('checks, downloads, and exposes a safe pending update without reloading', async () => {
    const harness = createHarness({ updates: {
      checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })),
    } });
    await harness.controller.start();

    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending',
      prompt: 'visible',
      update,
    });
    expect(harness.updates.fetchUpdate).toHaveBeenCalledOnce();
    expect(harness.updates.reload).not.toHaveBeenCalled();
  });

  it('single-flights checks and throttles foreground checks for 15 minutes', async () => {
    let finish: ((value: { outcome: 'no_update' }) => void) | undefined;
    const checkForUpdate = vi.fn(() => new Promise<{ outcome: 'no_update' }>((resolve) => {
      finish = resolve;
    }));
    const harness = createHarness({ updates: { checkForUpdate } });
    const first = harness.controller.start();
    const overlap = harness.controller.handleForeground();
    await Promise.resolve();
    await Promise.resolve();
    expect(checkForUpdate).toHaveBeenCalledOnce();
    finish?.({ outcome: 'no_update' });
    await Promise.all([first, overlap]);

    harness.setNow(1_000 + 14 * 60 * 1_000);
    await harness.controller.handleForeground();
    expect(checkForUpdate).toHaveBeenCalledOnce();

    harness.setNow(1_000 + 15 * 60 * 1_000);
    const next = harness.controller.handleForeground();
    await Promise.resolve();
    finish?.({ outcome: 'no_update' });
    await next;
    expect(checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('keeps check and fetch failures non-blocking', async () => {
    const failedCheck = createHarness({ updates: {
      checkForUpdate: vi.fn(async () => { throw new Error('offline secret'); }),
    } });
    await failedCheck.controller.start();
    expect(failedCheck.controller.getSnapshot()).toMatchObject({
      status: 'idle',
      lastError: 'CHECK_FAILED',
    });

    const failedFetch = createHarness({ updates: {
      checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })),
      fetchUpdate: vi.fn(async () => { throw new Error('network'); }),
    } });
    await failedFetch.controller.start();
    expect(failedFetch.controller.getSnapshot()).toMatchObject({
      status: 'idle',
      lastError: 'FETCH_FAILED',
    });
  });

  it('defers during an active session and re-evaluates on foreground', async () => {
    const evaluate = vi.fn()
      .mockResolvedValueOnce({ safe: false as const, reason: 'active_focus' as const })
      .mockResolvedValueOnce({ safe: true as const });
    const harness = createHarness({
      updates: { checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })) },
      safety: { evaluate },
    });
    await harness.controller.start();
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending', prompt: 'deferred', deferredReason: 'active_focus',
    });

    await harness.controller.handleForeground();
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending', prompt: 'visible',
    });
  });

  it('rechecks safety before reload, reloads once, and recovers a rejection', async () => {
    const reload = vi.fn(async () => { throw new Error('reload failed'); });
    const harness = createHarness({ updates: {
      checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })),
      reload,
    } });
    await harness.controller.start();
    const first = harness.controller.requestRestart();
    const overlap = harness.controller.requestRestart();
    await Promise.all([first, overlap]);

    expect(reload).toHaveBeenCalledOnce();
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending', prompt: 'visible', lastError: 'RELOAD_FAILED',
    });
  });

  it('dismisses the prompt without discarding the pending update', async () => {
    const harness = createHarness({ updates: {
      checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })),
    } });
    await harness.controller.start();
    harness.controller.dismissPrompt();
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending', prompt: 'dismissed', update,
    });
    await harness.controller.handleForeground();
    expect(harness.safety.evaluate).toHaveBeenCalledOnce();
    await harness.controller.requestRestart();
    expect(harness.updates.reload).not.toHaveBeenCalled();
  });

  it('fails closed when safety changes between the prompt and confirmation', async () => {
    const evaluate = vi.fn()
      .mockResolvedValueOnce({ safe: true as const })
      .mockResolvedValueOnce({ safe: false as const, reason: 'active_break' as const });
    const harness = createHarness({
      updates: { checkForUpdate: vi.fn(async () => ({ outcome: 'available' as const, update })) },
      safety: { evaluate },
    });
    await harness.controller.start();
    await harness.controller.requestRestart();
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: 'pending', prompt: 'deferred', deferredReason: 'active_break',
    });
    expect(harness.updates.reload).not.toHaveBeenCalled();
  });
});
