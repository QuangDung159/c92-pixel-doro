import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '../persistence/session.repository';
import { LoadRunningBreakUseCase } from './load-running-break.use-case';

const row: SessionRecord = {
  id: 'break-1', profileId: 1, sessionType: 'long_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 15,
  startedAt: 10_000, endsAt: 910_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-09', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 10_000, updatedAt: 10_000,
};

describe('LoadRunningBreakUseCase', () => {
  it('returns an exact durable running projection', async () => {
    const useCase = new LoadRunningBreakUseCase({
      findById: async () => ({ ok: true, value: row }),
    });
    expect(await useCase.execute('break-1')).toEqual({
      ok: true,
      value: { sessionId: 'break-1', kind: 'long', durationMinutes: 15,
        startedAt: 10_000, endsAt: 910_000 },
    });
  });

  it.each([
    null,
    { ...row, status: 'completed', resolvedAt: 910_000, updatedAt: 910_000 },
    { ...row, sessionType: 'focus', focusVariant: 'standard', mode: 'relax', workTag: 'coding' },
  ])('rejects missing, terminal, or foreign rows', async (value) => {
    const useCase = new LoadRunningBreakUseCase({
      findById: async () => ({ ok: true, value: value as SessionRecord | null }),
    });
    expect(await useCase.execute('break-1')).toMatchObject({
      ok: false, error: { code: 'BREAK_SESSION_INELIGIBLE' },
    });
  });
});
