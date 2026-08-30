export type PetBaseState = 'idle' | 'working' | 'breaking';

export type CommittedActiveSessionFact = Readonly<{
  status: 'running';
  sessionType: 'focus' | 'short_break' | 'long_break';
}>;

export type PetBaseStateDecision =
  | Readonly<{ ok: true; state: PetBaseState }>
  | Readonly<{ ok: false; reason: 'invalid_active_session' }>;

const validSessionTypes = new Set([
  'focus',
  'short_break',
  'long_break',
]);

export const derivePetBaseState = (
  activeSession: CommittedActiveSessionFact | null,
): PetBaseStateDecision => {
  if (activeSession === null) {
    return Object.freeze({ ok: true, state: 'idle' });
  }

  if (
    activeSession.status !== 'running' ||
    !validSessionTypes.has(activeSession.sessionType)
  ) {
    return Object.freeze({ ok: false, reason: 'invalid_active_session' });
  }

  return Object.freeze({
    ok: true,
    state: activeSession.sessionType === 'focus' ? 'working' : 'breaking',
  });
};
