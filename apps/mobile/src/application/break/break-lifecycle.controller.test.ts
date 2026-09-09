import { describe, expect, it, vi } from 'vitest';

import { BreakLifecycleController } from './break-lifecycle.controller';
import { BreakOutcomeController } from './break-outcome.controller';

const create = (result: Awaited<ReturnType<ConstructorParameters<
  typeof BreakLifecycleController>[0]['reconcile']>>) => {
  const enterRecovery = vi.fn();
  const refresh = vi.fn(async () => undefined);
  const setAppVisible = vi.fn();
  const petRefresh = vi.fn(async () => undefined);
  const outcome = new BreakOutcomeController();
  const controller = new BreakLifecycleController({
    criticalRecovery: { enterRecovery }, outcome,
    petCompanion: { refresh: petRefresh } as never,
    session: { refresh, setAppVisible } as never,
    reconcile: async () => result,
  }, 'active');
  return { controller, enterRecovery, outcome, petRefresh, refresh, setAppVisible };
};

describe('BreakLifecycleController', () => {
  it('stops visible ticks on background without a durable command', async () => {
    const state = create({ ok: true, value: { outcome: 'running', sessionId: 'break-1' } });
    state.controller.handleState('background');
    await state.controller.whenIdle();
    expect(state.setAppVisible).toHaveBeenCalledWith(false);
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it('publishes committed completion then refreshes exact session and Pet', async () => {
    const state = create({ ok: true, value: { outcome: 'completed', sessionId: 'break-1',
      resolvedAt: 301_000, freshness: 'fresh_commit' } });
    await state.controller.reconcileNow('break-1');
    expect(state.outcome.getSnapshot()).toEqual({
      status: 'completed', sessionId: 'break-1', resolvedAt: 301_000,
    });
    expect(state.refresh).toHaveBeenCalledWith('break-1');
    expect(state.petRefresh).toHaveBeenCalledOnce();
    expect(state.enterRecovery).not.toHaveBeenCalled();
  });

  it('enters critical recovery without fabricating completion', async () => {
    const state = create({ ok: false, error: {
      kind: 'reconcile_break_error', code: 'BREAK_RECONCILE_STATE_INVALID',
    } });
    await state.controller.reconcileNow('break-1');
    expect(state.enterRecovery).toHaveBeenCalledWith('DURABLE_DATA_CORRUPT');
    expect(state.outcome.getSnapshot()).toEqual({ status: 'idle' });
    expect(state.refresh).not.toHaveBeenCalled();
  });
});
