import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '../persistence/session.repository';
import { LoadStandardFocusCancelledResultUseCase } from './load-standard-focus-cancelled-result.use-case';

const cancelled = (): SessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'cancelled', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: 2_000,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 2_000,
});

describe('LoadStandardFocusCancelledResultUseCase', () => {
  it('reads exact committed cancelled facts', async () => {
    const useCase = new LoadStandardFocusCancelledResultUseCase({
      sessions: { findById: async (id) => ({ ok: true, value: id === 'focus-1' ? cancelled() : null }) },
    });
    expect(await useCase.execute('focus-1')).toEqual({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          status: 'cancelled',
          sessionId: 'focus-1', durationMinutes: 25, mode: 'relax', workTag: 'coding',
          startedAt: 1_000, endsAt: 1_501_000, resolvedAt: 2_000,
          xpEarned: 0, coinsEarned: 0,
        },
      },
    });
    expect(await useCase.execute('other')).toEqual({ ok: true, value: { outcome: 'missing' } });
  });

  it.each([
    { status: 'running', resolvedAt: null },
    { backgroundedAt: 1_500 },
    { xpEarned: 1 },
    { rewardClaimedAt: 2_000 },
  ])('fails closed for inconsistent exact facts', async (change) => {
    const useCase = new LoadStandardFocusCancelledResultUseCase({
      sessions: { findById: async () => ({ ok: true, value: { ...cancelled(), ...change } as SessionRecord }) },
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: false, error: { code: 'STANDARD_FOCUS_RESULT_INCONSISTENT' },
    });
  });

  it('reads exact committed Strict failed facts', async () => {
    const failed: SessionRecord = {
      ...cancelled(),
      mode: 'strict',
      status: 'failed',
      backgroundedAt: 10_000,
      resolvedAt: 20_000,
      updatedAt: 20_000,
    };
    const useCase = new LoadStandardFocusCancelledResultUseCase({
      sessions: { findById: async () => ({ ok: true, value: failed }) },
    });
    expect(await useCase.execute('focus-1')).toMatchObject({
      ok: true,
      value: {
        outcome: 'ready',
        result: {
          status: 'failed',
          mode: 'strict',
          backgroundedAt: 10_000,
          xpEarned: 0,
          coinsEarned: 0,
        },
      },
    });
  });
});
