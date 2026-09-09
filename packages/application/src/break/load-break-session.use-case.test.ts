import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '../persistence/session.repository';
import { LoadBreakSessionUseCase } from './load-break-session.use-case';

const running: SessionRecord = {
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
};

const load = (value: SessionRecord | null) => new LoadBreakSessionUseCase({
  findById: async () => ({ ok: true, value }),
});

describe('LoadBreakSessionUseCase', () => {
  it('loads exact running and completed Break projections', async () => {
    expect(await load(running).execute('break-1')).toEqual({ ok: true, value: {
      status: 'running', sessionId: 'break-1', kind: 'short', durationMinutes: 5,
      startedAt: 1_000, endsAt: 301_000,
    } });
    expect(await load({ ...running, status: 'completed', resolvedAt: 302_000,
      updatedAt: 302_000 }).execute('break-1')).toEqual({ ok: true, value: {
      status: 'completed', sessionId: 'break-1', kind: 'short', durationMinutes: 5,
      startedAt: 1_000, endsAt: 301_000, resolvedAt: 302_000,
    } });
  });

  it.each([
    null,
    { ...running, status: 'cancelled', resolvedAt: 2_000, updatedAt: 2_000 },
    { ...running, status: 'completed', resolvedAt: 300_000, updatedAt: 300_000 },
    { ...running, sessionType: 'focus', focusVariant: 'standard', mode: 'relax', workTag: 'coding' },
  ])('fails closed for missing, unsupported terminal, corrupt and foreign rows', async (value) => {
    expect(await load(value as SessionRecord | null).execute('break-1')).toMatchObject({
      ok: false, error: { code: 'BREAK_SESSION_INELIGIBLE' },
    });
  });
});
