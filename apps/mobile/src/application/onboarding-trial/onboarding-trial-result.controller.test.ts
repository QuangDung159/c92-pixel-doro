import { describe, expect, it, vi } from 'vitest';
import type { LoadOnboardingTrialResultUseCase } from '@pixeldoro/application';

import { OnboardingTrialResultController } from './onboarding-trial-result.controller';

describe('OnboardingTrialResultController', () => {
  it('publishes committed result facts and coalesces reads', async () => {
    let resolve!: (value: unknown) => void;
    const execute = vi.fn(() => new Promise((done) => { resolve = done; }));
    const controller = new OnboardingTrialResultController({ execute } as unknown as LoadOnboardingTrialResultUseCase);

    const first = controller.refresh();
    const second = controller.refresh();
    expect(second).toBe(first);
    resolve({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          sessionId: 'trial-1', receiptId: 'receipt-1', resolvedAt: 10,
          xpEarned: 5, coinsEarned: 1, totalXp: 5, coinBalance: 1,
        },
      },
    });
    await first;

    expect(execute).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      result: { sessionId: 'trial-1', xpEarned: 5, coinsEarned: 1 },
    });
  });

  it('keeps an inconsistent durable result in recoverable error', async () => {
    const controller = new OnboardingTrialResultController({
      execute: async () => ({
        ok: false,
        error: {
          kind: 'load_onboarding_trial_result_error',
          code: 'ONBOARDING_TRIAL_RESULT_INCONSISTENT',
        },
      }),
    } as LoadOnboardingTrialResultUseCase);

    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'ONBOARDING_TRIAL_RESULT_INCONSISTENT' },
    });
  });
});
