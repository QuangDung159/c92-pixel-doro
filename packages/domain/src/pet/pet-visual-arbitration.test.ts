import { describe, expect, it } from 'vitest';

import { decidePetVisualState } from './pet-visual-arbitration';

const terminal = {
  status: 'active' as const,
  state: 'celebrating' as const,
  sessionId: 'completed-1',
};

describe('decidePetVisualState', () => {
  it('applies safety then active-session then terminal then idle priority', () => {
    expect(decidePetVisualState({ status: 'loading' }, terminal)).toEqual({
      kind: 'loading',
    });
    expect(decidePetVisualState({ status: 'recovery' }, terminal)).toEqual({
      kind: 'recovery',
      source: 'base',
    });
    expect(decidePetVisualState({
      status: 'ready',
      state: 'working',
      activeSessionId: 'focus-2',
    }, terminal)).toEqual({ kind: 'base', state: 'working' });
    expect(decidePetVisualState({
      status: 'ready',
      state: 'idle',
      activeSessionId: null,
    }, terminal)).toEqual({ kind: 'terminal', state: 'celebrating' });
    expect(decidePetVisualState({
      status: 'ready',
      state: 'idle',
      activeSessionId: null,
    }, { status: 'idle' })).toEqual({ kind: 'base', state: 'idle' });
  });

  it('enters recovery for impossible base or same-session active/terminal truth', () => {
    expect(decidePetVisualState({
      status: 'ready',
      state: 'idle',
      activeSessionId: 'focus-1',
    }, { status: 'idle' })).toEqual({ kind: 'recovery', source: 'base' });
    expect(decidePetVisualState({
      status: 'ready',
      state: 'working',
      activeSessionId: 'focus-1',
    }, { ...terminal, sessionId: 'focus-1' })).toEqual({
      kind: 'recovery',
      source: 'conflict',
    });
  });
});
