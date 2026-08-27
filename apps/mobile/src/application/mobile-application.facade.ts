import type { MobileBootstrap } from './bootstrap/mobile-bootstrap';

export interface MobileApplicationFacade {
  readonly bootstrap: MobileBootstrap;
  boot(): Promise<void>;
  dispose(): Promise<void>;
}
