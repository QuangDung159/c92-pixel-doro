import { describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '../persistence/session.repository';
import { completeStandardFocusInTransaction } from './complete-standard-focus-transaction';

const running: SessionRecord = {
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-04', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
};
describe('Standard completion CAS backstop', () => {
  it.each(['completed', 'cancelled', 'missing', 'running'] as const)(
    'rereads %s winner after CAS miss without attempting a second grant', async (winner) => {
      const row: SessionRecord | null = winner === 'missing' ? null : winner === 'running' ? running :
        winner === 'cancelled' ? { ...running, status: 'cancelled', resolvedAt: 2_000, updatedAt: 2_000 } :
          { ...running, status: 'completed', resolvedAt: 901_000, updatedAt: 901_000,
            rewardClaimedAt: 901_000, xpEarned: 15, coinsEarned: 3 };
      const receipt = winner === 'completed' ? { id: 'winner-receipt', sessionId: running.id,
        profileId: 1, reason: 'focus_completed' as const, xpDelta: 15, coinDelta: 3, createdAt: 901_000 } : null;
      const insert = vi.fn();
      const apply = vi.fn();
      const result = await completeStandardFocusInTransaction({
        id: { nextId: () => 'unused-receipt' },
        sessions: {
          transitionFromRunningInTransaction: async () => ({ ok: true, value: 'not_updated' }),
          findByIdInTransaction: async () => ({ ok: true, value: row }),
        },
        rewards: { insertInTransaction: insert, findBySessionIdInTransaction: async () => ({ ok: true, value: receipt }) },
        profile: { applyProgressionInTransaction: apply, findInTransaction: async () => ({ ok: true,
          value: { id: 1, totalXp: 15, coinBalance: 3, createdAt: 0, updatedAt: 901_000 } }) },
      }, { transactionId: Symbol('cas') }, running, 901_000);
      expect(result).toMatchObject(winner === 'completed' || winner === 'cancelled'
        ? { ok: true, value: { freshness: 'existing_terminal', result: { status: winner } } }
        : { ok: false, error: { code: 'STATE_INVALID' } });
      expect(insert).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    },
  );
});
