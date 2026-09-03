export {
  DOMAIN_PACKAGE_ID,
  domainFoundationHealth,
  type DomainFoundationHealth,
} from './foundation/domain-foundation';
export {
  deriveLevelProgression,
  levelThresholdXp,
  type LevelProgression,
} from './progression/level-progression';
export {
  derivePetBaseState,
  type CommittedActiveSessionFact,
  type PetBaseState,
  type PetBaseStateDecision,
} from './pet/pet-base-state';
export {
  decidePetTerminalFeedback,
  type FreshCommittedTerminalTransition,
  type PetTerminalFeedbackDecision,
  type PetTerminalState,
} from './pet/pet-terminal-feedback';
export {
  decidePetTerminalFreshness,
  type PetTerminalCandidate,
  type PetTerminalCurrentFeedback,
  type PetTerminalFreshnessContext,
  type PetTerminalFreshnessDecision,
} from './pet/pet-terminal-freshness';
export {
  decidePetVisualState,
  type PetVisualArbitrationDecision,
  type PetVisualBaseInput,
  type PetVisualTerminalInput,
} from './pet/pet-visual-arbitration';
export {
  STANDARD_FOCUS_DURATION_STEP_MINUTES,
  STANDARD_FOCUS_MAX_DURATION_MINUTES,
  STANDARD_FOCUS_MIN_DURATION_MINUTES,
  STANDARD_FOCUS_MODES,
  STANDARD_FOCUS_WORK_TAGS,
  validateStandardFocusConfiguration,
  type FocusMode,
  type StandardFocusConfiguration,
  type StandardFocusConfigurationDecision,
  type StandardFocusConfigurationErrorCode,
  type StandardFocusConfigurationInput,
  type WorkTag,
} from './focus/standard-focus-configuration';
export {
  projectRemainingTime,
  type RemainingTimeProjection,
} from './session/remaining-time.projection';
