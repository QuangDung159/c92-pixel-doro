export type PetTerminalState = 'celebrating' | 'bugged';

export interface FreshCommittedTerminalTransition {
  readonly sessionId: string;
  readonly committedAtMs: number;
  readonly sessionType: 'focus' | 'short_break' | 'long_break';
  readonly focusVariant: 'standard' | 'onboarding_trial' | null;
  readonly mode: 'relax' | 'strict' | null;
  readonly terminalStatus: 'completed' | 'failed' | 'cancelled';
  readonly rewardCommitted: boolean;
}

export type PetTerminalFeedbackDecision =
  | Readonly<{
      kind: 'feedback';
      state: PetTerminalState;
      durationMs: 1_500 | 2_000;
      dedupeKey: string;
    }>
  | Readonly<{
      kind: 'none';
      reason: 'terminal_result_has_no_pet_feedback';
    }>
  | Readonly<{
      kind: 'invalid';
      reason:
        | 'invalid_terminal_transition'
        | 'completed_focus_reward_not_committed';
    }>;

const invalid = (
  reason: Extract<PetTerminalFeedbackDecision, { kind: 'invalid' }>['reason'],
): PetTerminalFeedbackDecision => Object.freeze({ kind: 'invalid', reason });

const none = (): PetTerminalFeedbackDecision => Object.freeze({
  kind: 'none',
  reason: 'terminal_result_has_no_pet_feedback',
});

export const decidePetTerminalFeedback = (
  transition: FreshCommittedTerminalTransition,
): PetTerminalFeedbackDecision => {
  if (transition.sessionId.trim().length === 0) {
    return invalid('invalid_terminal_transition');
  }
  if (!Number.isFinite(transition.committedAtMs) || transition.committedAtMs < 0) {
    return invalid('invalid_terminal_transition');
  }

  if (transition.sessionType !== 'focus') {
    const validBreak =
      transition.focusVariant === null &&
      transition.mode === null &&
      transition.terminalStatus !== 'failed' &&
      !transition.rewardCommitted;
    return validBreak ? none() : invalid('invalid_terminal_transition');
  }

  if (transition.focusVariant === null || transition.mode === null) {
    return invalid('invalid_terminal_transition');
  }

  if (transition.terminalStatus === 'completed') {
    if (!transition.rewardCommitted) {
      return invalid('completed_focus_reward_not_committed');
    }
    return Object.freeze({
      kind: 'feedback',
      state: 'celebrating',
      durationMs: 2_000,
      dedupeKey: `${transition.sessionId}:completed`,
    });
  }

  if (transition.rewardCommitted) {
    return invalid('invalid_terminal_transition');
  }

  if (transition.terminalStatus === 'failed') {
    const strictStandardFocus =
      transition.focusVariant === 'standard' && transition.mode === 'strict';
    return strictStandardFocus
      ? Object.freeze({
          kind: 'feedback',
          state: 'bugged',
          durationMs: 1_500,
          dedupeKey: `${transition.sessionId}:failed`,
        })
      : invalid('invalid_terminal_transition');
  }

  return none();
};
