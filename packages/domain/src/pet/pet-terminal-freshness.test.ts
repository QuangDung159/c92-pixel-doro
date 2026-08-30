import { describe, expect, it } from 'vitest';

import { decidePetTerminalFreshness } from './pet-terminal-freshness';

const candidate = {
  sessionId: 'focus-2',
  terminalStatus: 'completed' as const,
  committedAtMs: 200,
  dedupeKey: 'focus-2:completed',
};

const context = {
  currentResultSessionId: 'focus-2',
  activeSessionId: null,
  knownTerminalStatus: undefined,
  candidateSeen: false,
  currentFeedback: undefined,
};

describe('decidePetTerminalFreshness', () => {
  it('accepts the current fresh committed Result candidate', () => {
    expect(decidePetTerminalFreshness(candidate, context)).toEqual({ kind: 'accept' });
  });

  it('drops a candidate outside current Result context or behind an active session', () => {
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      currentResultSessionId: 'focus-3',
    })).toEqual({ kind: 'drop', reason: 'stale' });
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      activeSessionId: 'focus-3',
    })).toEqual({ kind: 'drop', reason: 'stale' });
  });

  it('uses committed recency instead of fixed terminal-state priority', () => {
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      currentFeedback: {
        sessionId: 'focus-3',
        terminalStatus: 'failed',
        committedAtMs: 201,
      },
    })).toEqual({ kind: 'drop', reason: 'stale' });
    expect(decidePetTerminalFreshness({ ...candidate, committedAtMs: 202 }, {
      ...context,
      currentFeedback: {
        sessionId: 'focus-3',
        terminalStatus: 'failed',
        committedAtMs: 201,
      },
    })).toEqual({ kind: 'accept' });
  });

  it('detects duplicate and impossible same-session truth', () => {
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      candidateSeen: true,
    })).toEqual({ kind: 'drop', reason: 'duplicate' });
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      knownTerminalStatus: 'failed',
    })).toEqual({ kind: 'recovery', reason: 'conflicting_committed_truth' });
    expect(decidePetTerminalFreshness(candidate, {
      ...context,
      activeSessionId: candidate.sessionId,
    })).toEqual({ kind: 'recovery', reason: 'conflicting_committed_truth' });
  });
});
