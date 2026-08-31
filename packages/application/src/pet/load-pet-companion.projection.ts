import {
  derivePetBaseState,
  type PetBaseState,
} from '@pixeldoro/domain';

import type { SessionRepository } from '../persistence/session.repository';

export type PetCompanionProjection =
  | Readonly<{ status: 'loading' }>
  | Readonly<{
      status: 'ready';
      baseState: PetBaseState;
      activeSessionId: string | null;
    }>
  | Readonly<{
      status: 'recovery';
      reason: 'committed_session_unavailable' | 'invalid_committed_session';
    }>;

export type PetCompanionSessionReader = Pick<SessionRepository, 'findActive'>;

const recovery = (
  reason: Extract<PetCompanionProjection, { status: 'recovery' }>['reason'],
): PetCompanionProjection => Object.freeze({ status: 'recovery', reason });

export const loadPetCompanionProjection = async (
  sessions: PetCompanionSessionReader,
): Promise<PetCompanionProjection> => {
  try {
    const activeResult = await sessions.findActive();
    if (!activeResult.ok) {
      return recovery(
        activeResult.error.code === 'PERSISTENCE_CORRUPT_DATA' ||
          activeResult.error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
          ? 'invalid_committed_session'
          : 'committed_session_unavailable',
      );
    }

    const activeSession = activeResult.value;
    const decision = derivePetBaseState(
      activeSession === null
        ? null
        : {
            status: activeSession.status as 'running',
            sessionType: activeSession.sessionType,
          },
    );
    if (!decision.ok || (activeSession !== null && activeSession.status !== 'running')) {
      return recovery('invalid_committed_session');
    }

    return Object.freeze({
      status: 'ready',
      baseState: decision.state,
      activeSessionId: activeSession?.id ?? null,
    });
  } catch {
    return recovery('committed_session_unavailable');
  }
};
