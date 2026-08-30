import { describe, expect, it, vi } from 'vitest';

import type { PetCompanionProjection } from './load-pet-companion.projection';
import type { PetTerminalFeedbackProjection } from './pet-terminal-feedback.controller';
import {
  PetVisualController,
  type PetVisualBaseSource,
  type PetVisualTerminalSource,
} from './pet-visual.controller';

class MutableBase implements PetVisualBaseSource {
  private listeners = new Set<() => void>();

  constructor(private projection: PetCompanionProjection) {}

  getSnapshot = () => this.projection;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  publish(projection: PetCompanionProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}

class MutableTerminal implements PetVisualTerminalSource {
  private listeners = new Set<() => void>();
  readonly preempt = vi.fn((activeSessionId: string) => {
    if (
      this.projection.status === 'active' &&
      this.projection.sessionId !== activeSessionId
    ) {
      this.publish({ status: 'idle' });
    }
  });

  constructor(private projection: PetTerminalFeedbackProjection) {}

  getSnapshot = () => this.projection;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  preemptByCommittedActiveSession = (activeSessionId: string) => {
    this.preempt(activeSessionId);
  };
  publish(projection: PetTerminalFeedbackProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}

const activeFeedback = (): PetTerminalFeedbackProjection => ({
  status: 'active',
  feedbackId: 'focus-1:completed',
  sessionId: 'focus-1',
  terminalStatus: 'completed',
  committedAtMs: 100,
  state: 'celebrating',
  startedAtMs: 100,
  endsAtMs: 2_100,
  visualMode: 'one-shot',
});

describe('PetVisualController', () => {
  it('shows idle, then terminal feedback, then the current base', () => {
    const base = new MutableBase({
      status: 'ready',
      baseState: 'idle',
      activeSessionId: null,
    });
    const terminal = new MutableTerminal({ status: 'idle' });
    const controller = new PetVisualController(base, terminal);

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      source: 'base',
      state: 'idle',
    });
    terminal.publish(activeFeedback());
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      source: 'terminal',
      state: 'celebrating',
    });
    terminal.publish({ status: 'idle' });
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      source: 'base',
      state: 'idle',
    });
  });

  it.each([
    ['working', 'new-focus'],
    ['breaking', 'new-break'],
  ] as const)('preempts one-shot with committed %s and never resumes it', (
    baseState,
    activeSessionId,
  ) => {
    const base = new MutableBase({
      status: 'ready',
      baseState: 'idle',
      activeSessionId: null,
    });
    const terminal = new MutableTerminal(activeFeedback());
    const controller = new PetVisualController(base, terminal);

    base.publish({ status: 'ready', baseState, activeSessionId });

    expect(terminal.preempt).toHaveBeenCalledWith(activeSessionId);
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      source: 'base',
      state: baseState,
    });
    expect(terminal.getSnapshot()).toEqual({ status: 'idle' });
  });

  it('keeps recovery above active and terminal visual truth', () => {
    const base = new MutableBase({ status: 'recovery', reason: 'committed_session_unavailable' });
    const terminal = new MutableTerminal(activeFeedback());
    const controller = new PetVisualController(base, terminal);

    expect(controller.getSnapshot()).toEqual({
      status: 'recovery',
      source: 'base',
      reason: 'committed_session_unavailable',
    });
  });

  it('new runtime starts from base and never hydrates a terminal effect', () => {
    const base = new MutableBase({
      status: 'ready',
      baseState: 'idle',
      activeSessionId: null,
    });
    const controller = new PetVisualController(
      base,
      new MutableTerminal({ status: 'idle' }),
    );

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      source: 'base',
      state: 'idle',
    });
  });
});
