export {
  MobileBootstrap,
  type BootstrapProjection,
  type MobileBootstrapDependencies,
} from './bootstrap/mobile-bootstrap';
export type {
  AppLifecyclePort,
  AppLifecycleState,
} from './ports/app-lifecycle.port';
export {
  databaseLifecycleError,
  type DatabaseLifecycleError,
  type DatabaseLifecycleErrorCode,
  type DatabaseLifecyclePort,
} from './ports/database-lifecycle.port';
export type { MobileApplicationFacade } from './mobile-application.facade';
