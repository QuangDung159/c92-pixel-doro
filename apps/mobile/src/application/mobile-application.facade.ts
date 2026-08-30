import type {
  PetCompanionController,
  PetTerminalFeedbackController,
} from '@pixeldoro/application';

import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';
import type { CommandReadinessPort } from './readiness/readiness-gate';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
  readonly readiness: CommandReadinessPort;
  boot(): Promise<void>;
  dismissPetTerminalFeedbackError(): void;
  refreshPetCompanion(): Promise<void>;
  triggerPetTerminalReviewFixture(): void;
  retryRecovery(): Promise<void>;
  dispose(): Promise<void>;
}
