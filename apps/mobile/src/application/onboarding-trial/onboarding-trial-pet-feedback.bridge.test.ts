import { describe, expect, it, vi } from 'vitest';
import type { OnboardingTrialFreshCompletionEvent } from '@pixeldoro/application';

import type { OnboardingTrialCompletionController } from './onboarding-trial-completion.controller';
import { OnboardingTrialPetFeedbackBridge } from './onboarding-trial-pet-feedback.bridge';

const event: OnboardingTrialFreshCompletionEvent = {
  eventId: 'event-1',
  sessionId: 'trial-1',
  receiptId: 'receipt-1',
  resolvedAt: 100,
  xpEarned: 5,
  coinsEarned: 1,
};

const harness = () => {
  const trace: string[] = [];
  let freshEvent: OnboardingTrialFreshCompletionEvent | null = event;
  let base = {
    status: 'ready' as const,
    baseState: 'idle' as const,
    activeSessionId: null as string | null,
  };
  const discardFreshEvent = vi.fn(() => {
    freshEvent = null;
  });
  const requestFreshTransition = vi.fn(() => {
    trace.push('request');
    return {
      accepted: true as const,
      feedbackId: 'trial-1:completed',
    };
  });
  const bridge = new OnboardingTrialPetFeedbackBridge({
    completion: {
      getSnapshot: () => ({
        status: 'committed',
        result: {},
        freshEvent,
      }),
      subscribe: vi.fn(() => vi.fn()),
      discardFreshEvent,
    } as unknown as OnboardingTrialCompletionController,
    petCompanion: {
      refresh: vi.fn(async () => {
        trace.push('base');
      }),
      getSnapshot: () => base,
    } as never,
    petTerminalFeedback: {
      requestFreshTransition,
      dismissRecovery: vi.fn(),
    } as never,
  });
  return {
    bridge,
    discardFreshEvent,
    requestFreshTransition,
    trace,
    setActiveSession: (activeSessionId: string | null) => {
      base = { ...base, activeSessionId };
    },
  };
};

describe('OnboardingTrialPetFeedbackBridge', () => {
  it('refreshes committed base then maps one exact onboarding celebration', async () => {
    const { bridge, discardFreshEvent, requestFreshTransition, trace } = harness();
    await bridge.retry();
    expect(requestFreshTransition).toHaveBeenCalledWith({
      sessionId: 'trial-1',
      committedAtMs: 100,
      sessionType: 'focus',
      focusVariant: 'onboarding_trial',
      mode: 'relax',
      terminalStatus: 'completed',
      rewardCommitted: true,
    }, {
      currentResultSessionId: 'trial-1',
      activeSessionId: null,
    });
    expect(discardFreshEvent).toHaveBeenCalledOnce();
    expect(trace).toEqual(['base', 'request']);
    expect(bridge.getSnapshot()).toEqual({ status: 'delivered', eventId: 'event-1' });
  });

  it('retains the event when committed base conflicts', async () => {
    const { bridge, discardFreshEvent, requestFreshTransition, setActiveSession } = harness();
    setActiveSession('other-session');
    await bridge.retry();
    expect(requestFreshTransition).not.toHaveBeenCalled();
    expect(discardFreshEvent).not.toHaveBeenCalled();
    expect(bridge.getSnapshot()).toMatchObject({
      status: 'recovery',
      reason: 'conflicting_committed_truth',
    });
  });

  it('drops known duplicate safely instead of replaying', async () => {
    const { bridge, discardFreshEvent, requestFreshTransition } = harness();
    requestFreshTransition.mockReturnValueOnce({
      accepted: false,
      reason: 'duplicate_terminal_transition',
    } as never);
    await bridge.retry();
    expect(discardFreshEvent).toHaveBeenCalledOnce();
    await bridge.retry();
    expect(requestFreshTransition).toHaveBeenCalledOnce();
  });

  it('retains a runtime failure and delivers the same event on explicit retry', async () => {
    const { bridge, discardFreshEvent, requestFreshTransition } = harness();
    requestFreshTransition
      .mockReturnValueOnce({
        accepted: false,
        reason: 'feedback_runtime_unavailable',
      } as never)
      .mockReturnValueOnce({
        accepted: true,
        feedbackId: 'trial-1:completed',
      });

    await bridge.retry();
    expect(discardFreshEvent).not.toHaveBeenCalled();
    expect(bridge.getSnapshot()).toMatchObject({
      status: 'recovery',
      reason: 'feedback_runtime_unavailable',
    });
    await bridge.retry();
    expect(requestFreshTransition).toHaveBeenCalledTimes(2);
    expect(discardFreshEvent).toHaveBeenCalledOnce();
  });
});
