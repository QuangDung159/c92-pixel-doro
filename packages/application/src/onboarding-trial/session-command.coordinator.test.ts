import { describe, expect, it } from 'vitest';

import { SessionCommandCoordinator } from './session-command.coordinator';

describe('SessionCommandCoordinator', () => {
  it('runs commands in FIFO order and releases after a failure', async () => {
    const coordinator = new SessionCommandCoordinator();
    const events: string[] = [];
    const first = coordinator.run(async () => {
      events.push('first:start');
      await Promise.resolve();
      events.push('first:end');
      throw new Error('expected');
    });
    const second = coordinator.run(async () => {
      events.push('second');
      return 2;
    });

    await expect(first).rejects.toThrow('expected');
    await expect(second).resolves.toBe(2);
    expect(events).toEqual(['first:start', 'first:end', 'second']);
  });
});
