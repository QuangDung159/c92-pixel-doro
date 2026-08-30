import { describe, expect, it } from 'vitest';

import { derivePetBaseState } from './pet-base-state';

describe('derivePetBaseState', () => {
  it.each([
    [null, 'idle'],
    [{ status: 'running', sessionType: 'focus' } as const, 'working'],
    [{ status: 'running', sessionType: 'short_break' } as const, 'breaking'],
    [{ status: 'running', sessionType: 'long_break' } as const, 'breaking'],
  ])('maps committed active fact %j to %s', (fact, state) => {
    expect(derivePetBaseState(fact)).toEqual({ ok: true, state });
  });

  it.each([
    { status: 'completed', sessionType: 'focus' },
    { status: 'running', sessionType: 'unknown' },
  ])('rejects impossible or corrupt active fact %j', (fact) => {
    expect(derivePetBaseState(fact as never)).toEqual({
      ok: false,
      reason: 'invalid_active_session',
    });
  });
});
