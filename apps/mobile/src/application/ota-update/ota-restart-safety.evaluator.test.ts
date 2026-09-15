import { describe, expect, it, vi } from 'vitest';

import { OtaRestartSafetyEvaluator } from './ota-restart-safety.evaluator';

const createEvaluator = (overrides: Partial<ConstructorParameters<
  typeof OtaRestartSafetyEvaluator
>[0]> = {}) => new OtaRestartSafetyEvaluator({
  isBootstrapReady: () => true,
  isCriticalOperationActive: () => false,
  waitForLifecycleIdle: async () => undefined,
  runAfterSessionCommands: async (work) => work(),
  findActiveSession: async () => ({ ok: true as const, value: null }),
  ...overrides,
});

describe('OtaRestartSafetyEvaluator', () => {
  it('allows restart only after lifecycle and session command barriers', async () => {
    const order: string[] = [];
    const evaluator = createEvaluator({
      waitForLifecycleIdle: async () => { order.push('lifecycle'); },
      runAfterSessionCommands: async (work) => {
        order.push('commands');
        return work();
      },
      findActiveSession: async () => {
        order.push('read');
        return { ok: true as const, value: null };
      },
    });

    await expect(evaluator.evaluate()).resolves.toEqual({ safe: true });
    expect(order).toEqual(['lifecycle', 'commands', 'read']);
  });

  it.each([
    [{ sessionType: 'focus' as const, focusVariant: 'standard' as const }, 'active_focus'],
    [{ sessionType: 'focus' as const, focusVariant: 'onboarding_trial' as const }, 'active_trial'],
    [{ sessionType: 'short_break' as const, focusVariant: null }, 'active_break'],
    [{ sessionType: 'long_break' as const, focusVariant: null }, 'active_break'],
  ])('defers for active session %j', async (value, reason) => {
    const evaluator = createEvaluator({
      findActiveSession: async () => ({ ok: true as const, value }),
    });
    await expect(evaluator.evaluate()).resolves.toEqual({ safe: false, reason });
  });

  it('fails closed for bootstrap, transaction, and read failures', async () => {
    await expect(createEvaluator({ isBootstrapReady: () => false }).evaluate())
      .resolves.toEqual({ safe: false, reason: 'bootstrap_not_ready' });
    await expect(createEvaluator({ isCriticalOperationActive: () => true }).evaluate())
      .resolves.toEqual({ safe: false, reason: 'critical_operation' });
    await expect(createEvaluator({
      findActiveSession: async () => ({ ok: false as const }),
    }).evaluate()).resolves.toEqual({ safe: false, reason: 'session_read_failed' });
  });

  it('rechecks bootstrap after awaiting lifecycle work', async () => {
    const ready = vi.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const findActiveSession = vi.fn();
    const evaluator = createEvaluator({ isBootstrapReady: ready, findActiveSession });

    await expect(evaluator.evaluate()).resolves.toEqual({
      safe: false,
      reason: 'bootstrap_not_ready',
    });
    expect(findActiveSession).not.toHaveBeenCalled();
  });
});
