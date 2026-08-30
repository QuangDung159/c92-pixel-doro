export interface PetTerminalCandidate {
  readonly sessionId: string;
  readonly terminalStatus: 'completed' | 'failed' | 'cancelled';
  readonly committedAtMs: number;
  readonly dedupeKey: string;
}

export interface PetTerminalCurrentFeedback {
  readonly sessionId: string;
  readonly terminalStatus: PetTerminalCandidate['terminalStatus'];
  readonly committedAtMs: number;
}

export interface PetTerminalFreshnessContext {
  readonly currentResultSessionId: string;
  readonly activeSessionId: string | null;
  readonly knownTerminalStatus: PetTerminalCandidate['terminalStatus'] | undefined;
  readonly candidateSeen: boolean;
  readonly currentFeedback: PetTerminalCurrentFeedback | undefined;
}

export type PetTerminalFreshnessDecision =
  | Readonly<{ kind: 'accept' }>
  | Readonly<{ kind: 'drop'; reason: 'duplicate' | 'stale' }>
  | Readonly<{ kind: 'recovery'; reason: 'conflicting_committed_truth' }>;

export const decidePetTerminalFreshness = (
  candidate: PetTerminalCandidate,
  context: PetTerminalFreshnessContext,
): PetTerminalFreshnessDecision => {
  if (
    context.knownTerminalStatus !== undefined &&
    context.knownTerminalStatus !== candidate.terminalStatus
  ) {
    return Object.freeze({
      kind: 'recovery',
      reason: 'conflicting_committed_truth',
    });
  }

  if (context.activeSessionId === candidate.sessionId) {
    return Object.freeze({
      kind: 'recovery',
      reason: 'conflicting_committed_truth',
    });
  }

  if (
    context.currentResultSessionId !== candidate.sessionId ||
    context.activeSessionId !== null
  ) {
    return Object.freeze({ kind: 'drop', reason: 'stale' });
  }

  if (context.candidateSeen) {
    return Object.freeze({ kind: 'drop', reason: 'duplicate' });
  }

  const current = context.currentFeedback;
  if (current !== undefined && candidate.committedAtMs <= current.committedAtMs) {
    return Object.freeze({ kind: 'drop', reason: 'stale' });
  }

  return Object.freeze({ kind: 'accept' });
};
