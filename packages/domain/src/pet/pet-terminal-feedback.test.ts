import { describe, expect, it } from 'vitest';

import {
  decidePetTerminalFeedback,
  type FreshCommittedTerminalTransition,
} from './pet-terminal-feedback';

const focusTransition = (
  overrides: Partial<FreshCommittedTerminalTransition> = {},
): FreshCommittedTerminalTransition => ({
  sessionId: 'focus-1',
  committedAtMs: 100,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  terminalStatus: 'completed',
  rewardCommitted: true,
  ...overrides,
});

describe('decidePetTerminalFeedback', () => {
  it.each(['standard', 'onboarding_trial'] as const)(
    'celebrates a freshly committed completed %s Focus',
    (focusVariant) => {
      expect(decidePetTerminalFeedback(focusTransition({ focusVariant }))).toEqual({
        kind: 'feedback',
        state: 'celebrating',
        durationMs: 2_000,
        dedupeKey: 'focus-1:completed',
      });
    },
  );

  it('requires committed reward truth before Celebrate', () => {
    expect(decidePetTerminalFeedback(
      focusTransition({ rewardCommitted: false }),
    )).toEqual({
      kind: 'invalid',
      reason: 'completed_focus_reward_not_committed',
    });
  });

  it('shows Bugged only for a freshly committed Strict standard Focus failure', () => {
    expect(decidePetTerminalFeedback(focusTransition({
      mode: 'strict',
      terminalStatus: 'failed',
      rewardCommitted: false,
    }))).toEqual({
      kind: 'feedback',
      state: 'bugged',
      durationMs: 1_500,
      dedupeKey: 'focus-1:failed',
    });
  });

  it.each([
    focusTransition({ terminalStatus: 'cancelled', rewardCommitted: false }),
    {
      sessionId: 'break-1',
      committedAtMs: 100,
      sessionType: 'short_break',
      focusVariant: null,
      mode: null,
      terminalStatus: 'completed',
      rewardCommitted: false,
    } as const,
  ])('does not request feedback for valid non-feedback terminal result', (transition) => {
    expect(decidePetTerminalFeedback(transition)).toEqual({
      kind: 'none',
      reason: 'terminal_result_has_no_pet_feedback',
    });
  });

  it.each([
    focusTransition({ mode: 'relax', terminalStatus: 'failed', rewardCommitted: false }),
    focusTransition({ focusVariant: 'onboarding_trial', terminalStatus: 'failed', rewardCommitted: false }),
    focusTransition({ sessionId: ' ' }),
  ])('rejects impossible transition %j', (transition) => {
    expect(decidePetTerminalFeedback(transition).kind).toBe('invalid');
  });
});
