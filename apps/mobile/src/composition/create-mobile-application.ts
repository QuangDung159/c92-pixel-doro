import { CreateFoundationSnapshotUseCase } from '@pixeldoro/application';

import { MobileBootstrap } from '@/application';
import { NoopAppLifecycleAdapter } from '@/infrastructure/platform/app-lifecycle/noop-app-lifecycle.adapter';
import { DeviceClockAdapter } from '@/infrastructure/platform/clock/device-clock.adapter';
import { DeviceIdAdapter } from '@/infrastructure/platform/id/device-id.adapter';

import type { MobileApplication } from './mobile-application';

export const createMobileApplication = (): MobileApplication => {
  const appLifecycle = new NoopAppLifecycleAdapter();
  const clock = new DeviceClockAdapter();
  const id = new DeviceIdAdapter();
  const createFoundationSnapshot = new CreateFoundationSnapshotUseCase({ clock, id });
  const bootstrap = new MobileBootstrap({ appLifecycle, createFoundationSnapshot });

  return {
    bootstrap,
    boot: () => bootstrap.boot(),
    dispose: () => bootstrap.dispose(),
  };
};

