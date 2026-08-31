import { describe, expect, it, vi } from 'vitest';
import type { OnboardingTrialCommittedResult } from '@pixeldoro/application';

import type { MobileBootstrap } from '../bootstrap/mobile-bootstrap';
import type { FirstUseEntryController } from '../first-use';
import type { CompleteFirstUseHandoffUseCase } from './complete-first-use-handoff.use-case';
import { OnboardingTrialHandoffController } from './onboarding-trial-handoff.controller';

const result: OnboardingTrialCommittedResult = {
  sessionId: 'trial-1',
  receiptId: 'receipt-1',
  resolvedAt: 20,
  xpEarned: 5,
  coinsEarned: 1,
  totalXp: 5,
  coinBalance: 1,
};

const harness = () => {
  const trace: string[] = [];
  const execute = vi.fn(async () => {
    trace.push('persist');
    return {
      ok: true as const,
      value: { outcome: 'completed_fresh' as const, completedAt: 30 },
    };
  });
  const refreshSnapshot = vi.fn(async () => {
    trace.push('snapshot');
    return {
      ok: true as const,
      value: {
        installation: { onboardingCompletedAt: 30 },
        profile: { totalXp: 5, coinBalance: 1 },
      },
    };
  });
  const refreshEntry = vi.fn(async () => {
    trace.push('entry');
  });
  const refreshPet = vi.fn(async () => {
    trace.push('pet');
  });
  const controller = new OnboardingTrialHandoffController({
    bootstrap: {
      refreshReadySnapshot: refreshSnapshot,
    } as unknown as MobileBootstrap,
    completeHandoff: { execute } as unknown as CompleteFirstUseHandoffUseCase,
    firstUseEntry: {
      refresh: refreshEntry,
      getSnapshot: () => ({ status: 'ready', destination: 'home' }),
    } as unknown as FirstUseEntryController,
    petCompanion: {
      refresh: refreshPet,
      getSnapshot: () => ({ status: 'ready', baseState: 'idle', activeSessionId: null }),
    } as never,
  });
  return { controller, execute, refreshSnapshot, trace };
};

describe('OnboardingTrialHandoffController', () => {
  it('persists, refreshes, verifies, then succeeds without waiting for Pet feedback', async () => {
    const { controller, trace } = harness();
    await expect(controller.complete(result)).resolves.toMatchObject({
      ok: true,
      value: { completedAt: 30 },
    });
    expect(trace[0]).toBe('persist');
    expect(trace[1]).toBe('snapshot');
    expect(trace.slice(2).sort()).toEqual(['entry', 'pet']);
    expect(controller.getSnapshot()).toEqual({ status: 'success', completedAt: 30 });
  });

  it('coalesces double submit into one operation', async () => {
    const { controller, execute } = harness();
    const first = controller.complete(result);
    const second = controller.complete(result);
    expect(second).toBe(first);
    await first;
    expect(execute).toHaveBeenCalledOnce();
  });

  it('stays recoverable when snapshot refresh fails or totals are stale', async () => {
    const refreshFailure = harness();
    refreshFailure.refreshSnapshot.mockResolvedValueOnce({
      ok: false,
      error: {
        kind: 'bootstrap_refresh_error',
        code: 'BOOTSTRAP_REFRESH_READ_FAILED',
      },
    } as never);
    await expect(refreshFailure.controller.complete(result)).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_HANDOFF_REFRESH_FAILED' },
    });

    const mismatch = harness();
    mismatch.refreshSnapshot.mockResolvedValueOnce({
      ok: true,
      value: {
        installation: { onboardingCompletedAt: 30 },
        profile: { totalXp: 0, coinBalance: 0 },
      },
    } as never);
    await expect(mismatch.controller.complete(result)).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_HANDOFF_STATE_INCONSISTENT' },
    });
  });
});
