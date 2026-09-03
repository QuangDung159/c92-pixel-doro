import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { ActiveSessionStartupReconciliationAdapter } from './active-session-startup-reconciliation.adapter';

const running = (): RunningSessionRecord => ({
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'running', workTag: 'coding', configuredDurationMinutes: 25,
  startedAt: 1_000, endsAt: 1_501_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-03', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
});

describe('ActiveSessionStartupReconciliationAdapter', () => {
  it('runs the existing reconciliation then validates Standard active truth without writing', async () => {
    const delegate = { reconcileAtStartup: vi.fn(async () => ({
      ok: true as const, value: { durableDataChanged: false },
    })) };
    const findActive = vi.fn(async () => ({ ok: true as const, value: running() }));
    const adapter = new ActiveSessionStartupReconciliationAdapter(delegate, { findActive });
    expect(await adapter.reconcileAtStartup()).toEqual({
      ok: true, value: { durableDataChanged: false },
    });
    expect(delegate.reconcileAtStartup).toHaveBeenCalledOnce();
    expect(findActive).toHaveBeenCalledOnce();
  });

  it('fails closed for malformed Standard truth', async () => {
    const adapter = new ActiveSessionStartupReconciliationAdapter(
      { reconcileAtStartup: async () => ({ ok: true, value: { durableDataChanged: false } }) },
      { findActive: async () => ({ ok: true, value: { ...running(), workTag: null } }) },
    );
    expect(await adapter.reconcileAtStartup()).toMatchObject({
      ok: false, error: { code: 'STARTUP_RECONCILIATION_FAILED' },
    });
  });
});
