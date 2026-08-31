import type { PetBaseState } from './pet-base-state';
import type { PetTerminalState } from './pet-terminal-feedback';

export type PetVisualBaseInput =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'recovery' }>
  | Readonly<{
      status: 'ready';
      state: PetBaseState;
      activeSessionId: string | null;
    }>;

export type PetVisualTerminalInput =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'recovery' }>
  | Readonly<{
      status: 'active';
      state: PetTerminalState;
      sessionId: string;
    }>;

export type PetVisualArbitrationDecision =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'recovery'; source: 'base' | 'terminal' | 'conflict' }>
  | Readonly<{ kind: 'base'; state: PetBaseState }>
  | Readonly<{ kind: 'terminal'; state: PetTerminalState }>;

export const decidePetVisualState = (
  base: PetVisualBaseInput,
  terminal: PetVisualTerminalInput,
): PetVisualArbitrationDecision => {
  if (base.status === 'loading') return Object.freeze({ kind: 'loading' });
  if (base.status === 'recovery') {
    return Object.freeze({ kind: 'recovery', source: 'base' });
  }
  if (terminal.status === 'recovery') {
    return Object.freeze({ kind: 'recovery', source: 'terminal' });
  }

  const activeBase = base.state === 'working' || base.state === 'breaking';
  if (activeBase) {
    if (base.activeSessionId === null) {
      return Object.freeze({ kind: 'recovery', source: 'base' });
    }
    if (
      terminal.status === 'active' &&
      terminal.sessionId === base.activeSessionId
    ) {
      return Object.freeze({ kind: 'recovery', source: 'conflict' });
    }
    return Object.freeze({ kind: 'base', state: base.state });
  }

  if (base.activeSessionId !== null) {
    return Object.freeze({ kind: 'recovery', source: 'base' });
  }
  if (terminal.status === 'active') {
    return Object.freeze({ kind: 'terminal', state: terminal.state });
  }
  return Object.freeze({ kind: 'base', state: 'idle' });
};
