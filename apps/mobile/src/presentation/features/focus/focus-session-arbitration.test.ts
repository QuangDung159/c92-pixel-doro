import { describe, expect, it } from 'vitest';

import { decideFocusSessionBranch } from './focus-session-arbitration';

describe('Focus Session production arbitration', () => {
  it('waits for both durable readers before allowing prototype fallback', () => {
    expect(decideFocusSessionBranch(
      { status: 'missing' },
      { status: 'loading' },
    )).toBe('loading');
    expect(decideFocusSessionBranch(
      { status: 'missing' },
      { status: 'missing' },
    )).toBe('prototype');
  });

  it('prioritizes trial then committed Standard Focus and fails closed on read errors', () => {
    expect(decideFocusSessionBranch(
      {
        status: 'ready', phase: 'running', sessionId: 'trial-1',
        endsAt: 2_000, remainingMs: 1_000, displaySeconds: 1,
      },
      {
        status: 'ready', phase: 'running', sessionId: 'focus-1', durationMinutes: 25,
        mode: 'relax', workTag: 'coding', startedAt: 1_000, endsAt: 2_000,
        remainingMs: 1_000, displaySeconds: 1,
      },
    )).toBe('trial');
    expect(decideFocusSessionBranch(
      { status: 'missing' },
      {
        status: 'ready', phase: 'running', sessionId: 'focus-1', durationMinutes: 25,
        mode: 'relax', workTag: 'coding', startedAt: 1_000, endsAt: 2_000,
        remainingMs: 1_000, displaySeconds: 1,
      },
    )).toBe('standard');
    expect(decideFocusSessionBranch(
      { status: 'missing' },
      { status: 'error', error: { code: 'STANDARD_FOCUS_READ_FAILED' } },
    )).toBe('standard_error');
  });
});
