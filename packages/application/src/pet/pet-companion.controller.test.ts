import { describe, expect, it, vi } from 'vitest';

import { PetCompanionController } from './pet-companion.controller';

describe('PetCompanionController', () => {
  it('publishes loading then rebuilt committed projection', async () => {
    const listeners = vi.fn();
    const controller = new PetCompanionController({
      findActive: vi.fn(async () => ({ ok: true as const, value: null })),
    });
    controller.subscribe(listeners);

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      baseState: 'idle',
      activeSessionId: null,
    });
    expect(listeners).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent refreshes', async () => {
    const findActive = vi.fn(async () => ({ ok: true as const, value: null }));
    const controller = new PetCompanionController({ findActive });

    await Promise.all([controller.refresh(), controller.refresh()]);

    expect(findActive).toHaveBeenCalledOnce();
  });
});
