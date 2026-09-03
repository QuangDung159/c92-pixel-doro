import type {
  ApplicationResult,
  CancelOnboardingTrialError,
  CancelOnboardingTrialOutcome,
  OnboardingTrialCommittedResult,
  PetCompanionController,
  PetTerminalFeedbackController,
  PetVisualController,
  StartOnboardingTrialError,
  StartOnboardingTrialOutcome,
} from '@pixeldoro/application';

import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';
import type { FirstUseEntryController } from './first-use';
import type {
  CommandReadinessError,
  CommandReadinessPort,
} from './readiness/readiness-gate';
import type { AppVisibilityController } from './visibility/app-visibility.controller';
import type { PetVisualDiagnostic } from './ports/pet-visual-diagnostics.port';
import type {
  CompleteFirstUseHandoffOutcome,
  OnboardingTrialCompletionController,
  OnboardingTrialHandoffController,
  OnboardingTrialHandoffError,
  OnboardingTrialPetFeedbackBridge,
  OnboardingTrialResultController,
  OnboardingTrialRunningController,
} from './onboarding-trial';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  readonly firstUseEntry: FirstUseEntryController;
  readonly onboardingTrialRunning: OnboardingTrialRunningController;
  readonly onboardingTrialCompletion: OnboardingTrialCompletionController;
  readonly onboardingTrialHandoff: OnboardingTrialHandoffController;
  readonly onboardingTrialPetFeedback: OnboardingTrialPetFeedbackBridge;
  readonly onboardingTrialResult: OnboardingTrialResultController;
  readonly appVisibility: AppVisibilityController;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly petVisual: PetVisualController;
  readonly petTerminalReviewFixtureAvailable: boolean;
  readonly readiness: CommandReadinessPort;
  boot(): Promise<void>;
  cancelOnboardingTrial(
    sessionId: string,
  ): Promise<
    ApplicationResult<
      CancelOnboardingTrialOutcome,
      CancelOnboardingTrialError | CommandReadinessError
    >
  >;
  completeFirstUseHandoff(
    result: OnboardingTrialCommittedResult,
  ): Promise<
    ApplicationResult<
      CompleteFirstUseHandoffOutcome,
      OnboardingTrialHandoffError | CommandReadinessError
    >
  >;
  dismissPetTerminalFeedbackError(): void;
  discardPetTerminalFeedback(): void;
  refreshPetCompanion(): Promise<void>;
  refreshFirstUseEntry(): Promise<void>;
  refreshOnboardingTrialRunning(): Promise<void>;
  refreshOnboardingTrialResult(): Promise<void>;
  reconcileOnboardingTrial(sessionId?: string): ReturnType<
    OnboardingTrialCompletionController['reconcile']
  >;
  retryOnboardingTrialCompletion(): ReturnType<
    OnboardingTrialCompletionController['retry']
  >;
  retryOnboardingTrialPetFeedback(): Promise<void>;
  recordPetVisualDiagnostic(diagnostic: PetVisualDiagnostic): void;
  reportPetVisualComplete(feedbackId: string): void;
  reportPetVisualFailure(feedbackId: string): void;
  triggerPetTerminalReviewFixture(): Promise<void>;
  retryRecovery(): Promise<void>;
  startOnboardingTrial(): Promise<
    ApplicationResult<
      StartOnboardingTrialOutcome,
      StartOnboardingTrialError | CommandReadinessError
    >
  >;
  dispose(): Promise<void>;
}
