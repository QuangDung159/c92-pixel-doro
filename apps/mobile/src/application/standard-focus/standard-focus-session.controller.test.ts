import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { StandardFocusSessionController } from './standard-focus-session.controller';

const runningStandard = (): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

describe('StandardFocusSessionController', () => {
  it('projects only committed Standard Focus facts', async () => {
    const controller = new StandardFocusSessionController({
      sessions: { findActive: async () => ({ ok: true, value: runningStandard() }) },
    });
    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', sessionId: 'focus-1', durationMinutes: 25,
      mode: 'relax', workTag: 'coding', startedAt: 1_000, endsAt: 1_501_000,
    });
  });

  it('coalesces concurrent reads and publishes missing for another valid branch', async () => {
    let resolve!: (value: { ok: true; value: null }) => void;
    const read = vi.fn(() => new Promise<{ ok: true; value: null }>((done) => { resolve = done; }));
    const controller = new StandardFocusSessionController({ sessions: { findActive: read } });
    const first = controller.refresh();
    const second = controller.refresh();
    expect(first).toBe(second);
    resolve({ ok: true, value: null });
    await first;
    expect(read).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({ status: 'missing' });
  });

  it('fails closed for malformed Standard truth and read failures', async () => {
    const malformed = { ...runningStandard(), workTag: null };
    const invalid = new StandardFocusSessionController({
      sessions: { findActive: async () => ({ ok: true, value: malformed }) },
    });
    await invalid.refresh();
    expect(invalid.getSnapshot()).toMatchObject({
      status: 'error', error: { code: 'STANDARD_FOCUS_STATE_INVALID' },
    });

    const failed = new StandardFocusSessionController({
      sessions: { findActive: async () => { throw new Error('offline'); } },
    });
    await failed.refresh();
    expect(failed.getSnapshot()).toMatchObject({
      status: 'error', error: { code: 'STANDARD_FOCUS_READ_FAILED' },
    });
  });
});
