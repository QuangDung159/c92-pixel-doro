import { describe, expect, it, vi } from 'vitest';

import {
  MobileBootstrap,
  ReadinessGate,
  type AppLifecyclePort,
  type AppLifecycleState,
  type BootstrapDurableSnapshot,
  type BootstrapPhase,
  type MobileBootstrapDependencies,
} from '@/application';

const snapshot: BootstrapDurableSnapshot = {
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
};

class FakeLifecycle implements AppLifecyclePort {
  private listener: ((state: AppLifecycleState) => void) | undefined;
  readonly subscribe = vi.fn((listener: (state: AppLifecycleState) => void) => {
    this.listener = listener;
    return this.unsubscribe;
  });
  readonly unsubscribe = vi.fn();

  constructor(private state: AppLifecycleState = 'active') {}

  getCurrentState(): AppLifecycleState {
    return this.state;
  }

  emit(state: AppLifecycleState): void {
    this.state = state;
    this.listener?.(state);
  }
}

interface HarnessOptions {
  readonly failAt?: BootstrapPhase;
  readonly throwAt?: BootstrapPhase;
  readonly deferredAt?: BootstrapPhase;
}

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((release) => {
    resolve = release;
  });
  return { promise, resolve };
};

const createHarness = (options: HarnessOptions = {}) => {
  const trace: string[] = [];
  const gate = new ReadinessGate();
  const lifecycle = new FakeLifecycle('background');
  const phaseGate = deferred();
  const run = async <TValue>(
    phase: BootstrapPhase,
    success: TValue,
    failure: TValue,
  ): Promise<TValue> => {
    trace.push(phase);
    if (options.deferredAt === phase) await phaseGate.promise;
    if (options.throwAt === phase) throw new Error('raw provider detail');
    return options.failAt === phase ? failure : success;
  };

  const dependencies: MobileBootstrapDependencies = {
    appLifecycle: lifecycle,
    databaseLifecycle: {
      open: vi.fn(() =>
        run(
          'opening',
          { ok: true as const, value: undefined },
          {
            ok: false as const,
            error: {
              kind: 'database_lifecycle_error' as const,
              code: 'DATABASE_OPEN_FAILED' as const,
            },
          },
        ),
      ),
      close: vi.fn(async () => {
        trace.push('close');
        return { ok: true as const, value: undefined };
      }),
    },
    migration: {
      migrate: vi.fn(() =>
        run(
          'migrating',
          {
            ok: true as const,
            value: { fromVersion: 0, toVersion: 1, appliedVersions: [1] },
          },
          {
            ok: false as const,
            error: {
              kind: 'migration_error' as const,
              code: 'MIGRATION_APPLY_FAILED' as const,
            },
          },
        ),
      ),
    },
    bootstrapVerifier: {
      verify: vi.fn(() =>
        run(
          'verifying',
          { ok: true as const, value: undefined },
          {
            ok: false as const,
            error: {
              kind: 'bootstrap_verification_error' as const,
              code: 'BOOTSTRAP_INVARIANT_FAILED' as const,
            },
          },
        ),
      ),
    },
    bootstrapData: {
      read: vi.fn(() =>
        run(
          'hydrating',
          { ok: true as const, value: snapshot },
          {
            ok: false as const,
            error: {
              kind: 'bootstrap_data_error' as const,
              code: 'BOOTSTRAP_DATA_INVALID' as const,
            },
          },
        ),
      ),
    },
    startupReconciliation: {
      reconcileAtStartup: vi.fn(() =>
        run(
          'reconciling',
          { ok: true as const, value: undefined },
          {
            ok: false as const,
            error: {
              kind: 'startup_reconciliation_error' as const,
              code: 'STARTUP_RECONCILIATION_FAILED' as const,
            },
          },
        ),
      ),
    },
    readiness: gate,
  };

  return {
    bootstrap: new MobileBootstrap(dependencies),
    dependencies,
    gate,
    lifecycle,
    phaseGate,
    trace,
  };
};

describe('mobile bootstrap integration', () => {
  it('publishes ready only after the exact durable barrier order', async () => {
    const { bootstrap, gate, lifecycle, trace } = createHarness();
    const projections: string[] = [];
    bootstrap.subscribe(() => {
      const current = bootstrap.getSnapshot();
      projections.push(
        current.status === 'booting'
          ? `${current.status}:${current.phase}`
          : current.status,
      );
    });
    const guardedWork = vi.fn(() => 'ran');

    expect(gate.run(guardedWork)).toMatchObject({
      ok: false,
      error: { code: 'CORE_COMMANDS_NOT_READY' },
    });
    await bootstrap.boot();

    expect(trace).toEqual([
      'opening',
      'migrating',
      'verifying',
      'hydrating',
      'reconciling',
    ]);
    expect(projections).toEqual([
      'booting:opening',
      'booting:migrating',
      'booting:verifying',
      'booting:hydrating',
      'booting:reconciling',
      'ready',
    ]);
    expect(bootstrap.getSnapshot()).toEqual({
      status: 'ready',
      snapshot,
      lifecycleState: 'background',
    });
    expect(gate.run(guardedWork)).toEqual({ ok: true, value: 'ran' });
    expect(guardedWork).toHaveBeenCalledOnce();

    lifecycle.emit('active');
    expect(bootstrap.getSnapshot()).toMatchObject({
      status: 'ready',
      lifecycleState: 'active',
    });
  });

  it.each<BootstrapPhase>([
    'opening',
    'migrating',
    'verifying',
    'hydrating',
    'reconciling',
  ])('fails closed at %s and never invokes the remaining suffix', async (phase) => {
    const { bootstrap, dependencies, gate, trace } = createHarness({
      failAt: phase,
    });

    await bootstrap.boot();

    expect(bootstrap.getSnapshot()).toMatchObject({
      status: 'recovery',
      phase,
    });
    expect(gate.run(() => 'forbidden')).toMatchObject({
      ok: false,
      error: { code: 'CORE_COMMANDS_NOT_READY' },
    });
    expect(trace.at(-1)).toBe(phase);
    expect(dependencies.databaseLifecycle.close).not.toHaveBeenCalled();
  });

  it.each<BootstrapPhase>([
    'opening',
    'migrating',
    'verifying',
    'hydrating',
    'reconciling',
  ])('maps a thrown %s provider failure without leaking raw detail', async (phase) => {
    const { bootstrap } = createHarness({ throwAt: phase });

    await expect(bootstrap.boot()).resolves.toBeUndefined();
    const projection = bootstrap.getSnapshot();
    expect(projection).toMatchObject({ status: 'recovery', phase });
    expect(JSON.stringify(projection)).not.toContain('provider detail');
  });

  it('coalesces concurrent boot and makes ready/recovery reruns no-ops', async () => {
    const readyHarness = createHarness({ deferredAt: 'migrating' });
    const first = readyHarness.bootstrap.boot();
    const second = readyHarness.bootstrap.boot();
    expect(second).toBe(first);
    readyHarness.phaseGate.resolve();
    await Promise.all([first, second]);
    await readyHarness.bootstrap.boot();
    expect(readyHarness.trace.filter((item) => item === 'opening')).toHaveLength(1);

    const recoveryHarness = createHarness({ failAt: 'verifying' });
    await recoveryHarness.bootstrap.boot();
    await recoveryHarness.bootstrap.boot();
    expect(recoveryHarness.trace.filter((item) => item === 'opening')).toHaveLength(1);
  });

  it.each<BootstrapPhase>([
    'opening',
    'migrating',
    'verifying',
    'hydrating',
    'reconciling',
  ])('prevents late ready and closes once when disposed during %s', async (phase) => {
    const { bootstrap, dependencies, gate, lifecycle, phaseGate } = createHarness({
      deferredAt: phase,
    });
    const boot = bootstrap.boot();
    while (true) {
      const current = bootstrap.getSnapshot();
      if (current.status !== 'booting' || current.phase === phase) break;
      await Promise.resolve();
    }
    expect(gate.run(() => 'forbidden')).toMatchObject({
      ok: false,
      error: { code: 'CORE_COMMANDS_NOT_READY' },
    });

    const firstDispose = bootstrap.dispose();
    const secondDispose = bootstrap.dispose();
    expect(secondDispose).toBe(firstDispose);
    expect(bootstrap.getSnapshot()).toEqual({ status: 'disposed' });
    phaseGate.resolve();
    await Promise.all([boot, firstDispose, secondDispose]);

    expect(bootstrap.getSnapshot()).toEqual({ status: 'disposed' });
    expect(dependencies.databaseLifecycle.close).toHaveBeenCalledOnce();
    expect(lifecycle.unsubscribe).toHaveBeenCalledTimes(
      phase === 'reconciling' ? 1 : 0,
    );
    expect(gate.run(() => 'forbidden')).toMatchObject({ ok: false });
  });

  it('buffers lifecycle changes during reconciliation without opening readiness', async () => {
    const { bootstrap, gate, lifecycle, phaseGate } = createHarness({
      deferredAt: 'reconciling',
    });
    const boot = bootstrap.boot();
    while (true) {
      const current = bootstrap.getSnapshot();
      if (current.status === 'booting' && current.phase === 'reconciling') break;
      await Promise.resolve();
    }

    lifecycle.emit('active');
    expect(bootstrap.getSnapshot()).toEqual({
      status: 'booting',
      phase: 'reconciling',
    });
    expect(gate.run(() => 'forbidden')).toMatchObject({ ok: false });

    phaseGate.resolve();
    await boot;
    expect(bootstrap.getSnapshot()).toMatchObject({
      status: 'ready',
      lifecycleState: 'active',
    });
  });
});
