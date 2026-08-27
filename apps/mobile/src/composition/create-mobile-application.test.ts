import { describe, expect, it } from 'vitest';

import { createMobileApplication } from './create-mobile-application';

describe('mobile composition root', () => {
  it('boots and disposes one application-scoped graph', () => {
    const application = createMobileApplication();

    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'idle' });

    application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');

    application.boot();
    expect(application.bootstrap.getSnapshot().status).toBe('ready');

    application.dispose();
    expect(application.bootstrap.getSnapshot()).toEqual({ status: 'idle' });
  });
});

