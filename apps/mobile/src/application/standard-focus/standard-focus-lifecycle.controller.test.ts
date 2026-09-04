import { describe, expect, it, vi } from 'vitest';

import { StandardFocusLifecycleController } from './standard-focus-lifecycle.controller';
import { StandardFocusOutcomeController } from './standard-focus-outcome.controller';

const dependencies = () => {
  let now = 2_000;
  const recordBackground = vi.fn(async () => ({
    ok: true as const,
    value: { outcome: 'recorded' as const, sessionId: 'strict-1' },
  }));
  const reconcile = vi.fn(async () => ({
    ok: true as const,
    value: { outcome: 'running' as const, sessionId: 'strict-1' },
  }));
  const setAppVisible = vi.fn();
  const refreshSession = vi.fn(async () => undefined);
  const refreshPet = vi.fn(async () => undefined);
  const refreshProfile = vi.fn(async () => true);
  const requestFreshTransition = vi.fn();
  const enterRecovery = vi.fn();
  const outcome = new StandardFocusOutcomeController();
  return {
    setNow: (value: number) => { now = value; },
    recordBackground, reconcile, setAppVisible, refreshSession, refreshPet,
    requestFreshTransition, enterRecovery, outcome, refreshProfile,
    value: {
      clock: { nowMs: () => now },
      criticalRecovery: { enterRecovery },
      refreshProfile,
      outcome,
      petCompanion: {
        refresh: refreshPet,
        getSnapshot: () => ({ status: 'ready', activeSessionId: null }),
      },
      petTerminalFeedback: { requestFreshTransition },
      session: { setAppVisible, refresh: refreshSession },
      recordBackground,
      reconcile,
    } as never,
  };
};

describe('StandardFocusLifecycleController', () => {
  const completion = {
    ok: true, value: { outcome: 'completed', freshness: 'fresh_commit',
      result: { status: 'completed', sessionId: 'focus-1', receiptId: 'receipt-1',
        mode: 'relax', resolvedAt: 901_000 } },
  };
  it('refreshes Home and requests fresh completion feedback only once', async () => {
    const deps = dependencies();
    deps.reconcile.mockResolvedValueOnce(completion as never);
    const controller = new StandardFocusLifecycleController(deps.value, 'active');
    await controller.reconcileNow('focus-1');
    expect(deps.refreshProfile).toHaveBeenCalledOnce();
    expect(deps.outcome.getSnapshot()).toMatchObject({ status: 'completed', sessionId: 'focus-1' });
    expect(deps.requestFreshTransition).toHaveBeenCalledWith(
      expect.objectContaining({ terminalStatus: 'completed', rewardCommitted: true }),
      { currentResultSessionId: 'focus-1', activeSessionId: null },
    );
    deps.reconcile.mockResolvedValueOnce({ ...completion,
      value: { ...completion.value, freshness: 'existing_terminal' } } as never);
    await controller.reconcileNow('focus-1');
    expect(deps.requestFreshTransition).toHaveBeenCalledOnce();
  });
  it('retains exact committed handoff when profile hydration fails', async () => {
    const deps = dependencies();
    deps.reconcile.mockResolvedValueOnce(completion as never);
    deps.refreshProfile.mockResolvedValueOnce(false);
    await new StandardFocusLifecycleController(deps.value, 'active').reconcileNow();
    expect(deps.outcome.getSnapshot()).toMatchObject({ status: 'completed', sessionId: 'focus-1' });
    expect(deps.enterRecovery).toHaveBeenCalledWith('DATABASE_READ_FAILED');
    expect(deps.requestFreshTransition).not.toHaveBeenCalled();
  });
  it('waits for profile hydration before making the Result handoff visible', async () => {
    const deps = dependencies();
    deps.reconcile.mockResolvedValueOnce(completion as never);
    let finish: (value: boolean) => void = () => undefined;
    deps.refreshProfile.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const controller = new StandardFocusLifecycleController(deps.value, 'active');
    const operation = controller.reconcileNow();
    await vi.waitFor(() => expect(deps.refreshProfile).toHaveBeenCalledOnce());
    expect(deps.outcome.getSnapshot()).toEqual({ status: 'idle' });
    finish(true);
    await operation;
    expect(deps.outcome.getSnapshot()).toMatchObject({ status: 'completed' });
    expect(deps.requestFreshTransition).toHaveBeenCalledOnce();
  });
  it('does not turn a Pet failure into a reward recovery or grant retry', async () => {
    const deps = dependencies();
    deps.reconcile.mockResolvedValueOnce(completion as never);
    deps.refreshPet.mockRejectedValue(new Error('visual only'));
    deps.requestFreshTransition.mockImplementation(() => { throw new Error('animation only'); });
    await new StandardFocusLifecycleController(deps.value, 'active').reconcileNow();
    expect(deps.enterRecovery).not.toHaveBeenCalled();
    expect(deps.refreshSession).toHaveBeenCalledOnce();
    expect(deps.outcome.getSnapshot()).toMatchObject({ status: 'completed' });
  });
  it('captures background time before queued work and hides ticking immediately', async () => {
    const deps = dependencies();
    const controller = new StandardFocusLifecycleController(deps.value, 'active');
    controller.handleState('background');
    controller.handleState('background');
    deps.setNow(9_999);
    expect(deps.setAppVisible).toHaveBeenCalledWith(false);
    await controller.whenIdle();
    expect(deps.recordBackground).toHaveBeenCalledWith(2_000);
    expect(deps.recordBackground).toHaveBeenCalledOnce();
  });

  it('publishes and animates only a freshly committed failed reconciliation', async () => {
    const deps = dependencies();
    deps.reconcile.mockResolvedValueOnce({
      ok: true,
      value: {
        outcome: 'failed', sessionId: 'strict-1',
        freshness: 'fresh_commit', resolvedAt: 21_000,
      },
    } as never);
    const controller = new StandardFocusLifecycleController(deps.value, 'background');
    controller.handleState('active');
    await controller.whenIdle();
    expect(deps.outcome.getSnapshot()).toEqual({
      status: 'failed', sessionId: 'strict-1', resolvedAt: 21_000,
    });
    expect(deps.requestFreshTransition).toHaveBeenCalledOnce();
    expect(deps.setAppVisible).toHaveBeenLastCalledWith(true);
  });

  it('enters recovery instead of revealing a session after an uncertain write', async () => {
    const deps = dependencies();
    deps.recordBackground.mockResolvedValueOnce({
      ok: false,
      error: {
        kind: 'record_strict_background_error',
        code: 'STRICT_BACKGROUND_WRITE_FAILED',
      },
    } as never);
    const controller = new StandardFocusLifecycleController(deps.value, 'active');
    controller.handleState('background');
    await controller.whenIdle();
    expect(deps.enterRecovery).toHaveBeenCalledWith('DATABASE_WRITE_FAILED');
  });
});
