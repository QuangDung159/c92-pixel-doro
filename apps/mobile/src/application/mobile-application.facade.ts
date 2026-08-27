import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  boot(): void;
  dispose(): void;
}

