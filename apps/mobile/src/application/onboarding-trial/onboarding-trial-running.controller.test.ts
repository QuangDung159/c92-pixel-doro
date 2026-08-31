import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { OnboardingTrialRunningController } from './onboarding-trial-running.controller';

const runningTrial = (): RunningSessionRecord => ({
  id: 'trial-1',
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'onboarding_trial',
  mode: 'relax',
  status: 'running',
  workTag: null,
  configuredDurationMinutes: 5,
  startedAt: 1_000,
  endsAt: 301_000,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-08-31',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000,
  updatedAt: 1_000,
});

describe('OnboardingTrialRunningController', () => {
  it('derives each visible tick from the clock and pauses in background', async () => {
    let now = 1_000;
    let scheduled: (() => void) | undefined;
    const cancel = vi.fn();
    const controller = new OnboardingTrialRunningController({
      clock: { nowMs: () => now },
      scheduler: {
        schedule: (callback) => {
          scheduled = callback;
          return cancel;
        },
      },
      sessions: { findActive: async () => ({ ok: true, value: runningTrial() }) },
    });

    controller.activate();
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      phase: 'running',
      displaySeconds: 300,
    });

    now = 16_001;
    scheduled?.();
    expect(controller.getSnapshot()).toMatchObject({
      phase: 'running',
      displaySeconds: 285,
    });

    controller.setAppVisible(false);
    expect(cancel).toHaveBeenCalled();
    now = 301_000;
    controller.setAppVisible(true);
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      phase: 'deadline_pending',
      displaySeconds: 0,
    });
  });

  it('does not fall back to prototype on a durable read failure', async () => {
    const controller = new OnboardingTrialRunningController({
      clock: { nowMs: () => 1_000 },
      scheduler: { schedule: vi.fn() },
      sessions: {
        findActive: async () => ({
          ok: false,
          error: {
            kind: 'persistence_error',
            code: 'PERSISTENCE_QUERY_FAILED',
            entity: 'sessions',
            field: null,
          },
        }),
      },
    });

    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'ONBOARDING_TRIAL_READ_FAILED' },
    });
  });

  it('turns an unexpected reader throw into recoverable projection state', async () => {
    const controller = new OnboardingTrialRunningController({
      clock: { nowMs: () => 1_000 },
      scheduler: { schedule: vi.fn() },
      sessions: { findActive: async () => { throw new Error('unavailable'); } },
    });
    await expect(controller.refresh()).resolves.toBeUndefined();
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'ONBOARDING_TRIAL_READ_FAILED' },
    });
  });

  it('publishes missing for no durable onboarding trial', async () => {
    const controller = new OnboardingTrialRunningController({
      clock: { nowMs: () => 1_000 },
      scheduler: { schedule: vi.fn() },
      sessions: { findActive: async () => ({ ok: true, value: null }) },
    });
    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({ status: 'missing' });
  });
});
