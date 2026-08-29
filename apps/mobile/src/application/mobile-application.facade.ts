import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';
import type { CommandReadinessPort } from './readiness/readiness-gate';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  readonly readiness: CommandReadinessPort;
  boot(): Promise<void>;
  retryRecovery(): Promise<void>;
  dispose(): Promise<void>;
}
