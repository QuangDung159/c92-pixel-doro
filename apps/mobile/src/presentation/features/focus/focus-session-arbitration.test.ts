import { describe, expect, it } from 'vitest';

import {
  decideFocusSessionBranch,
  shouldOpenOnboardingTrialResult,
  shouldOpenStandardFocusResult,
} from './focus-session-arbitration';

describe('Focus Session production arbitration', () => {
  it('never redirects a loading/new/Trial session to an old Standard outcome', () => {
    const outcome = { status: 'completed', sessionId: 'old', receiptId: 'receipt', mode: 'relax', resolvedAt: 901_000 } as const;
    const standard = { status: 'ready', phase: 'running', sessionId: 'new', durationMinutes: 15,
      mode: 'relax', workTag: 'study', startedAt: 1_000, endsAt: 901_000, remainingMs: 900_000, displaySeconds: 900 } as const;
    expect(shouldOpenStandardFocusResult('loading', { status: 'loading' }, outcome)).toBe(false);
    expect(shouldOpenStandardFocusResult('trial', { status: 'missing' }, outcome)).toBe(false);
    expect(shouldOpenStandardFocusResult('standard', standard, outcome)).toBe(false);
    expect(shouldOpenStandardFocusResult('standard', { ...standard, sessionId: 'old' }, outcome)).toBe(true);
    expect(shouldOpenStandardFocusResult('prototype', { status: 'missing' }, outcome)).toBe(true);
  });
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

  it('opens the trial result only while the trial branch is active', () => {
    expect(shouldOpenOnboardingTrialResult('trial', 'committed')).toBe(true);
    expect(shouldOpenOnboardingTrialResult('standard', 'committed')).toBe(false);
    expect(shouldOpenOnboardingTrialResult('loading', 'committed')).toBe(false);
    expect(shouldOpenOnboardingTrialResult('trial', 'idle')).toBe(false);
  });
});
