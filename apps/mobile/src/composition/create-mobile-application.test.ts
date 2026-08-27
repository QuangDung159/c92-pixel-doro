import { describe, expect, it } from 'vitest';

import { createMobileApplication } from './create-mobile-application';
import { FakeSQLiteDriver } from '../../test/fakes/fake-sqlite-driver';

describe('mobile composition root', () => {
  it('boots and disposes one application-scoped graph', async () => {
    const driver = new FakeSQLiteDriver();
    const application = createMobileApplication({ sqliteDriver: driver });

    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'idle' });

    await application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');

    await application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');

    await application.dispose();
    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'idle' });
    expect(driver.openCalls).toBe(1);
    expect(driver.connection.closeCalls).toBe(1);
  });
});
