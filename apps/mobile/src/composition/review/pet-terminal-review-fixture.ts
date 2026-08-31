import type { FreshCommittedTerminalTransition } from '@pixeldoro/domain';

export type PetTerminalReviewScenario =
  | 'completed'
  | 'strict_failed'
  | 'cancelled'
  | 'break_completed'
  | 'duplicate_completed'
  | 'playback_error';

export interface PetTerminalReviewFixture {
  readonly transition: FreshCommittedTerminalTransition;
  readonly repeat: boolean;
  readonly reportVisualFailure: boolean;
}

const completedTransition = (): FreshCommittedTerminalTransition => ({
  sessionId: 'review-terminal-completed',
  committedAtMs: 100,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  terminalStatus: 'completed',
  rewardCommitted: true,
});

const fixture = (
  transition: FreshCommittedTerminalTransition,
  options: {
    readonly repeat?: boolean;
    readonly reportVisualFailure?: boolean;
  } = {},
): PetTerminalReviewFixture => Object.freeze({
  transition,
  repeat: options.repeat ?? false,
  reportVisualFailure: options.reportVisualFailure ?? false,
});

export const createPetTerminalReviewFixture = (
  value: string | undefined,
  enabled: boolean,
): PetTerminalReviewFixture | undefined => {
  if (!enabled || value === undefined) return undefined;

  switch (value as PetTerminalReviewScenario) {
    case 'completed':
      return fixture(completedTransition());
    case 'strict_failed':
      return fixture({
        sessionId: 'review-terminal-strict-failed',
        committedAtMs: 100,
        sessionType: 'focus',
        focusVariant: 'standard',
        mode: 'strict',
        terminalStatus: 'failed',
        rewardCommitted: false,
      });
    case 'cancelled':
      return fixture({
        ...completedTransition(),
        sessionId: 'review-terminal-cancelled',
        terminalStatus: 'cancelled',
        rewardCommitted: false,
      });
    case 'break_completed':
      return fixture({
        sessionId: 'review-break-completed',
        committedAtMs: 100,
        sessionType: 'short_break',
        focusVariant: null,
        mode: null,
        terminalStatus: 'completed',
        rewardCommitted: false,
      });
    case 'duplicate_completed':
      return fixture(completedTransition(), { repeat: true });
    case 'playback_error':
      return fixture(completedTransition(), { reportVisualFailure: true });
    default:
      return undefined;
  }
};
