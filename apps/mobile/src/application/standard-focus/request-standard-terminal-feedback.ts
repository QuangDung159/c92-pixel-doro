import type { PetCompanionController, PetTerminalFeedbackController } from '@pixeldoro/application';
import type { StandardFocusOutcomeProjection } from './standard-focus-outcome.controller';

export const requestStandardTerminalFeedback = (
  outcome: StandardFocusOutcomeProjection,
  pet: PetCompanionController,
  feedback: PetTerminalFeedbackController,
): void => {
  if (outcome.status === 'idle') return;
  const base = pet.getSnapshot();
  // A failed visual read must not fabricate a no-active-session fact.
  if (base.status !== 'ready') return;
  try {
    feedback.requestFreshTransition({
      sessionId: outcome.sessionId, committedAtMs: outcome.resolvedAt,
      sessionType: 'focus', focusVariant: 'standard',
      mode: outcome.status === 'completed' ? outcome.mode : 'strict',
      terminalStatus: outcome.status, rewardCommitted: outcome.status === 'completed',
    }, { currentResultSessionId: outcome.sessionId, activeSessionId: base.activeSessionId });
  } catch { /* Visual failure cannot change committed truth. */ }
};
