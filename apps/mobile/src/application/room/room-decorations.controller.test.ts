import { describe, expect, it } from 'vitest';

import { RoomDecorationsController } from './room-decorations.controller';

describe('RoomDecorationsController', () => {
  it('keeps committed room visible when a refocus refresh fails', async () => {
    let calls = 0;
    const controller = new RoomDecorationsController({
      execute: async () => ++calls === 1
        ? { ok: true, value: { items: [] } }
        : { ok: false, error: { kind: 'load_equipped_room_projection_error', code: 'ROOM_READ_FAILED' } },
    });
    await controller.activate();
    controller.deactivate();
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'ready', room: { items: [] }, refresh: 'error' });
  });

  it('isolates invalid data without entering global recovery', async () => {
    const controller = new RoomDecorationsController({
      execute: async () => ({ ok: false, error: { kind: 'load_equipped_room_projection_error', code: 'ROOM_CATALOG_INVALID' } }),
    });
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'error', code: 'ROOM_DATA_INVALID' });
  });
});
