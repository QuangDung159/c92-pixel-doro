import {
  decidePetVisualState,
  type PetBaseState,
  type PetTerminalState,
} from '@pixeldoro/domain';

import type { PetCompanionProjection } from './load-pet-companion.projection';
import type { PetTerminalFeedbackProjection } from './pet-terminal-feedback.controller';

export type PetVisualProjection =
  | Readonly<{ status: 'loading' }>
  | Readonly<{
      status: 'recovery';
      source: 'base' | 'terminal' | 'conflict';
      reason: string;
    }>
  | Readonly<{
      status: 'ready';
      source: 'base';
      state: PetBaseState;
      activeSessionId: string | null;
      announcementId: string;
      visualMode: 'still';
    }>
  | Readonly<{
      status: 'ready';
      source: 'terminal';
      state: PetTerminalState;
      feedbackId: string;
      announcementId: string;
      visualMode: 'one-shot' | 'still';
    }>;

export interface PetVisualBaseSource {
  getSnapshot(): PetCompanionProjection;
  subscribe(listener: () => void): () => void;
}

export interface PetVisualTerminalSource {
  getSnapshot(): PetTerminalFeedbackProjection;
  subscribe(listener: () => void): () => void;
  preemptByCommittedActiveSession(activeSessionId: string): void;
}

const loading = (): PetVisualProjection => Object.freeze({ status: 'loading' });

export class PetVisualController {
  private projection: PetVisualProjection = loading();
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribeBase: () => void;
  private readonly unsubscribeTerminal: () => void;
  private disposed = false;

  constructor(
    private readonly base: PetVisualBaseSource,
    private readonly terminal: PetVisualTerminalSource,
  ) {
    this.unsubscribeBase = base.subscribe(this.synchronize);
    this.unsubscribeTerminal = terminal.subscribe(this.synchronize);
    this.synchronize();
  }

  getSnapshot = (): PetVisualProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeBase();
    this.unsubscribeTerminal();
    this.listeners.clear();
  }

  private synchronize = (): void => {
    if (this.disposed) return;
    const baseProjection = this.base.getSnapshot();
    const terminalProjection = this.terminal.getSnapshot();
    if (
      baseProjection.status === 'ready' &&
      baseProjection.activeSessionId !== null &&
      terminalProjection.status === 'active'
    ) {
      this.terminal.preemptByCommittedActiveSession(
        baseProjection.activeSessionId,
      );
      return;
    }

    const decision = decidePetVisualState(
      baseProjection.status === 'ready'
        ? {
            status: 'ready',
            state: baseProjection.baseState,
            activeSessionId: baseProjection.activeSessionId,
          }
        : { status: baseProjection.status },
      terminalProjection.status === 'active'
        ? {
            status: 'active',
            state: terminalProjection.state,
            sessionId: terminalProjection.sessionId,
          }
        : { status: terminalProjection.status },
    );

    if (decision.kind === 'loading') {
      this.publish(loading());
      return;
    }
    if (decision.kind === 'recovery') {
      const reason = decision.source === 'base'
        ? baseProjection.status === 'recovery'
          ? baseProjection.reason
          : 'invalid_committed_session'
        : terminalProjection.status === 'recovery'
          ? terminalProjection.reason
          : 'conflicting_committed_truth';
      this.publish(Object.freeze({
        status: 'recovery',
        source: decision.source,
        reason,
      }));
      return;
    }
    if (decision.kind === 'terminal' && terminalProjection.status === 'active') {
      this.publish(Object.freeze({
        status: 'ready',
        source: 'terminal',
        state: decision.state,
        feedbackId: terminalProjection.feedbackId,
        announcementId: terminalProjection.feedbackId,
        visualMode: terminalProjection.visualMode,
      }));
      return;
    }
    if (baseProjection.status === 'ready') {
      this.publish(Object.freeze({
        status: 'ready',
        source: 'base',
        state: baseProjection.baseState,
        activeSessionId: baseProjection.activeSessionId,
        announcementId: `base:${baseProjection.baseState}:${baseProjection.activeSessionId ?? 'none'}`,
        visualMode: 'still',
      }));
    }
  };

  private publish(projection: PetVisualProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot change arbitration or durable truth.
      }
    }
  }
}
