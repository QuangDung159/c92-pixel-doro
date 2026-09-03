import { describe, expect, it } from 'vitest';

import { StandardFocusResultController } from './standard-focus-result.controller';

describe('StandardFocusResultController', () => {
  it('projects exact committed cancelled result', async () => {
    const controller = new StandardFocusResultController({
      execute: async (sessionId: string) => ({
        ok: true as const,
        value: {
          outcome: 'ready' as const,
          result: {
            sessionId, durationMinutes: 25, mode: 'relax' as const, workTag: 'coding' as const,
            startedAt: 1_000, endsAt: 1_501_000, resolvedAt: 2_000,
            xpEarned: 0 as const, coinsEarned: 0 as const,
          },
        },
      }),
    } as never);
    await controller.refresh('focus-1');
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', result: { sessionId: 'focus-1', xpEarned: 0, coinsEarned: 0 },
    });
  });

  it('keeps missing exact identity distinct from another result', async () => {
    const controller = new StandardFocusResultController({
      execute: async () => ({ ok: true, value: { outcome: 'missing' } }),
    } as never);
    await controller.refresh('missing');
    expect(controller.getSnapshot()).toEqual({ status: 'missing' });
  });
});
