import {
  persistenceError,
  transactionTechnicalError,
  type TransactionPort,
} from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import type { BootstrapDurableSnapshot } from '../ports/bootstrap-data.port';
import {
  ConfirmedLocalDataReset,
  type ConfirmedLocalDataResetDependencies,
  type ConfirmedResetBootstrapPort,
  type ConfirmedResetLease,
} from './confirmed-local-data-reset';

const snapshot: BootstrapDurableSnapshot = {
  migrationVersion: 1,
  installation: { installedAt: 10, onboardingCompletedAt: null },
  settings: {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    defaultMode: 'relax',
    soundEnabled: true,
    hapticsEnabled: true,
    notificationsEnabled: true,
    analyticsEnabled: true,
  },
  profile: { totalXp: 0, coinBalance: 0 },
  catalog: [],
};

const createBootstrap = () => {
  const lease: ConfirmedResetLease = { resetId: Symbol('reset') };
  const bootstrap: ConfirmedResetBootstrapPort = {
    beginConfirmedReset: vi.fn(() => ({ ok: true as const, value: lease })),
    restoreAfterFailedConfirmedReset: vi.fn(),
    enterRecoveryAfterUncertainConfirmedReset: vi.fn(),
    rebootstrapAfterCommittedConfirmedReset: vi.fn(() =>
      Promise.resolve({ ok: true as const, value: snapshot }),
    ),
  };
  return { bootstrap, lease };
};

const createDependencies = (
  overrides: Partial<ConfirmedLocalDataResetDependencies> = {},
): ConfirmedLocalDataResetDependencies => {
  const { bootstrap } = createBootstrap();
  return {
    activeSessions: { findActive: () => Promise.resolve({ ok: true, value: null }) },
    bootstrap,
    clock: { nowMs: () => 10 },
    diagnostics: { record: () => undefined },
    id: { nextId: () => 'new-id' },
    notificationCleanup: {
      cancelKnownSession: () => Promise.resolve({ ok: true, value: undefined }),
    },
    persistence: {
      resetInTransaction: () =>
        Promise.resolve({
          ok: true,
          value: {
            clearedAnalyticsEvents: 0,
            clearedOwnedItems: 0,
            clearedPurchaseTransactions: 0,
            clearedRewardTransactions: 0,
            clearedSessions: 0,
            clearedStoreReviewAttempts: 0,
          },
        }),
    },
    transaction: {
      execute: (work) => work({ transactionId: Symbol('scope') }),
    },
    ...overrides,
  };
};

describe('ConfirmedLocalDataReset', () => {
  it('passes a known active session ID to best-effort notification cleanup', async () => {
    const cleanup = vi.fn(() => Promise.resolve({ ok: true as const, value: undefined }));
    const reset = new ConfirmedLocalDataReset(
      createDependencies({
        activeSessions: {
          findActive: () =>
            Promise.resolve({
              ok: true,
              value: {
                id: 'active-session',
                profileId: 1,
                sessionType: 'focus',
                focusVariant: 'standard',
                mode: 'relax',
                status: 'running',
                workTag: null,
                configuredDurationMinutes: 25,
                startedAt: 10,
                endsAt: 1_500_010,
                backgroundedAt: null,
                resolvedAt: null,
                xpEarned: 0,
                coinsEarned: 0,
                rewardClaimedAt: null,
                scheduledEndLocalDate: '2026-08-29',
                scheduledEndUtcOffsetMinutes: 420,
                createdAt: 10,
                updatedAt: 10,
              },
            }),
        },
        notificationCleanup: { cancelKnownSession: cleanup },
      }),
    );

    expect(await reset.execute()).toMatchObject({ ok: true });
    expect(cleanup).toHaveBeenCalledWith('active-session');
  });

  it('restores the previous projection when seed input is invalid', async () => {
    const { bootstrap, lease } = createBootstrap();
    const transaction: TransactionPort = { execute: vi.fn() };
    const reset = new ConfirmedLocalDataReset(
      createDependencies({
        bootstrap,
        id: { nextId: () => '' },
        transaction,
      }),
    );

    expect(await reset.execute()).toEqual({
      ok: false,
      error: { kind: 'confirmed_reset_error', code: 'RESET_INVALID_SEED' },
    });
    expect(bootstrap.restoreAfterFailedConfirmedReset).toHaveBeenCalledWith(lease);
    expect(transaction.execute).not.toHaveBeenCalled();
  });

  it('enters critical recovery only when rollback leaves durable state uncertain', async () => {
    const { bootstrap, lease } = createBootstrap();
    const reset = new ConfirmedLocalDataReset(
      createDependencies({
        bootstrap,
        transaction: {
          execute: () =>
            Promise.resolve({
              ok: false,
              error: transactionTechnicalError('TRANSACTION_ROLLBACK_FAILED'),
            }),
        },
      }),
    );

    expect(await reset.execute()).toMatchObject({
      ok: false,
      error: { code: 'RESET_TRANSACTION_FAILED' },
    });
    expect(bootstrap.enterRecoveryAfterUncertainConfirmedReset).toHaveBeenCalledWith(lease);
    expect(bootstrap.restoreAfterFailedConfirmedReset).not.toHaveBeenCalled();
  });

  it('keeps the committed reset in recovery when post-commit bootstrap fails', async () => {
    const { bootstrap } = createBootstrap();
    bootstrap.rebootstrapAfterCommittedConfirmedReset = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          kind: 'confirmed_reset_bootstrap_error' as const,
          code: 'BOOTSTRAP_SEED_INVALID' as const,
        },
      }),
    );
    const reset = new ConfirmedLocalDataReset(createDependencies({ bootstrap }));

    expect(await reset.execute()).toMatchObject({
      ok: false,
      error: { code: 'RESET_COMMITTED_BOOTSTRAP_FAILED' },
    });
    expect(bootstrap.restoreAfterFailedConfirmedReset).not.toHaveBeenCalled();
  });

  it('sanitizes lookup and cleanup failures into warnings without blocking commit', async () => {
    const reset = new ConfirmedLocalDataReset(
      createDependencies({
        activeSessions: {
          findActive: () =>
            Promise.resolve({
              ok: false,
              error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
            }),
        },
        notificationCleanup: {
          cancelKnownSession: () => Promise.reject(new Error('raw provider payload')),
        },
      }),
    );

    expect(await reset.execute()).toMatchObject({
      ok: true,
      warnings: [
        { code: 'ACTIVE_SESSION_LOOKUP_FAILED' },
        { code: 'NOTIFICATION_CLEANUP_FAILED' },
      ],
    });
  });
});
