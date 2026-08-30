import type { PetCompanionController } from '@pixeldoro/application';

import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';
import type { CommandReadinessPort } from './readiness/readiness-gate';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  readonly petCompanion: PetCompanionController;
  readonly readiness: CommandReadinessPort;
  boot(): Promise<void>;
  refreshPetCompanion(): Promise<void>;
  retryRecovery(): Promise<void>;
  dispose(): Promise<void>;
}
