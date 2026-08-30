import type {
  PetCompanionController,
  PetTerminalFeedbackController,
  PetVisualController,
} from '@pixeldoro/application';

import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';
import type { CommandReadinessPort } from './readiness/readiness-gate';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly petVisual: PetVisualController;
  readonly petTerminalReviewFixtureAvailable: boolean;
  readonly readiness: CommandReadinessPort;
  boot(): Promise<void>;
  dismissPetTerminalFeedbackError(): void;
  discardPetTerminalFeedback(): void;
  refreshPetCompanion(): Promise<void>;
  triggerPetTerminalReviewFixture(): Promise<void>;
  retryRecovery(): Promise<void>;
  dispose(): Promise<void>;
}
