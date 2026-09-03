import { describe, expect, it, vi } from 'vitest';
import type {
  CompleteOnboardingTrialUseCase,
  OnboardingTrialCommittedResult,
} from '@pixeldoro/application';

import { OnboardingTrialCompletionController } from './onboarding-trial-completion.controller';
import type { OnboardingTrialResultController } from './onboarding-trial-result.controller';

const result: OnboardingTrialCommittedResult = {
  sessionId: 'trial-1', receiptId: 'receipt-1', resolvedAt: 10,
  xpEarned: 5, coinsEarned: 1, totalXp: 5, coinBalance: 1,
};

describe('OnboardingTrialCompletionController', () => {
  it('coalesces sources and publishes a fresh event after committed Result is readable', async () => {
    let resolve!: (value: unknown) => void;
    const execute = vi.fn(() => new Promise((done) => { resolve = done; }));
    const resultController = {
      refresh: vi.fn(async () => undefined),
      getSnapshot: () => ({ status: 'ready' as const, result }),
    };
    const controller = new OnboardingTrialCompletionController(
      { execute } as unknown as CompleteOnboardingTrialUseCase,
      resultController as unknown as OnboardingTrialResultController,
    );

    const deadline = controller.reconcile('trial-1');
    const foreground = controller.reconcile();
    expect(foreground).toBe(deadline);
    resolve({
      ok: true,
      value: {
        outcome: 'completed_fresh',
        result,
        event: {
          eventId: 'receipt-1', sessionId: 'trial-1', receiptId: 'receipt-1',
          resolvedAt: 10, xpEarned: 5, coinsEarned: 1,
        },
      },
    });
    await deadline;

    expect(execute).toHaveBeenCalledOnce();
    expect(resultController.refresh).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'committed',
      freshEvent: { eventId: 'receipt-1' },
    });
  });

  it('keeps completion failures retryable with the stable session id', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        error: { kind: 'complete_onboarding_trial_error', code: 'SESSION_COMPLETION_WRITE_FAILED' },
      })
      .mockResolvedValueOnce({ ok: true, value: { outcome: 'still_running', sessionId: 'trial-1', endsAt: 20 } });
    const controller = new OnboardingTrialCompletionController(
      { execute } as unknown as CompleteOnboardingTrialUseCase,
      {} as OnboardingTrialResultController,
    );

    await controller.reconcile('trial-1');
    expect(controller.getSnapshot()).toMatchObject({ status: 'error', sessionId: 'trial-1' });
    await controller.retry();
    expect(execute).toHaveBeenLastCalledWith('trial-1');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
});
