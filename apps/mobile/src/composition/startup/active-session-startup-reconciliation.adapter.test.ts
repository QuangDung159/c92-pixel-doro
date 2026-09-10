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
const runningBreak = (): RunningSessionRecord => ({
  ...running(), id: 'break-1', sessionType: 'short_break', focusVariant: null,
  mode: null, workTag: null, configuredDurationMinutes: 5, endsAt: 301_000,
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

  it('publishes only a fresh Strict failed commit from startup reconciliation', async () => {
    const publishFreshFailure = vi.fn();
    const adapter = new ActiveSessionStartupReconciliationAdapter(
      { reconcileAtStartup: async () => ({ ok: true, value: { durableDataChanged: false } }) },
      { findActive: async () => ({ ok: true, value: null }) },
      {
        reconcile: async () => ({
          ok: true,
          value: {
            outcome: 'failed', sessionId: 'strict-1',
            freshness: 'fresh_commit', resolvedAt: 21_000,
          },
        }),
        publishFreshFailure,
        publishFreshCompletion: vi.fn(),
      },
    );
    expect(await adapter.reconcileAtStartup()).toEqual({
      ok: true, value: { durableDataChanged: true },
    });
    expect(publishFreshFailure).toHaveBeenCalledWith('strict-1', 21_000);
  });

  it('accepts a running Break and publishes a fresh completed Break identity', async () => {
    const publishCompleted = vi.fn();
    const afterTerminal = vi.fn();
    let active: RunningSessionRecord | null = runningBreak();
    const adapter = new ActiveSessionStartupReconciliationAdapter(
      { reconcileAtStartup: async () => ({ ok: true, value: { durableDataChanged: false } }) },
      { findActive: async () => ({ ok: true, value: active }) },
      undefined,
      {
        reconcile: async () => {
          active = null;
          return { ok: true, value: { outcome: 'completed' as const, sessionId: 'break-1',
            resolvedAt: 301_000, freshness: 'fresh_commit' as const } };
        },
        publishCompleted,
        afterTerminal,
      },
    );
    expect(await adapter.reconcileAtStartup()).toEqual({
      ok: true, value: { durableDataChanged: true },
    });
    expect(publishCompleted).toHaveBeenCalledWith('break-1', 301_000);
    expect(afterTerminal).toHaveBeenCalledWith('break-1', 'completed', 'fresh_commit');
  });

  it('ensures a running Break notification at startup without creating terminal work', async () => {
    const ensureRunning = vi.fn();
    const active = runningBreak();
    const adapter = new ActiveSessionStartupReconciliationAdapter(
      { reconcileAtStartup: async () => ({ ok: true, value: { durableDataChanged: false } }) },
      { findActive: async () => ({ ok: true, value: active }) },
      undefined,
      {
        reconcile: async () => ({ ok: true, value: {
          outcome: 'running' as const, sessionId: 'break-1',
        } }),
        publishCompleted: vi.fn(), ensureRunning,
      },
    );
    expect(await adapter.reconcileAtStartup()).toMatchObject({ ok: true });
    expect(ensureRunning).toHaveBeenCalledWith(active);
  });
});
