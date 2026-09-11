import { describe, expect, it, vi } from 'vitest';
import type { SessionCommandCoordinatorPort } from '@pixeldoro/application';

import { createShopSlice } from './create-shop-slice';

describe('createShopSlice', () => {
  it('wires exact approved catalog through the shared coordinator', async () => {
    const coordinator: SessionCommandCoordinatorPort = {
      run: <TValue,>(operation: () => Promise<TValue>) => operation(),
    };
    const run = vi.spyOn(coordinator, 'run');
    const slice = createShopSlice({
      analyticsQueue: { enqueueBounded: vi.fn(async () => ({
        ok: true as const,
        value: 'enqueued' as const,
      })) },
      catalog: {
        findById: vi.fn(),
        findByIdInTransaction: vi.fn(),
        list: vi.fn(async () => ({ ok: true as const, value: [] })),
      },
      clock: { nowMs: () => 1_000 },
      coordinator,
      criticalRecovery: { enterRecovery: vi.fn() },
      economy: { verify: vi.fn(async () => ({
        ok: true as const,
        value: { profileId: 1, totalXp: 0, coinBalance: 0 },
      })) },
      id: { nextId: () => 'episode-1' },
      ownedItems: {
        find: vi.fn(),
        findInTransaction: vi.fn(),
        insertInTransaction: vi.fn(),
        listByProfile: vi.fn(async () => ({ ok: true as const, value: [] })),
        setEquippedInTransaction: vi.fn(),
      },
      profile: {
        findInTransaction: vi.fn(),
        debitCatalogItemInTransaction: vi.fn(),
      },
      purchases: {
        findByProfileAndItem: vi.fn(),
        findByProfileAndItemInTransaction: vi.fn(),
        insertInTransaction: vi.fn(),
      },
      readiness: { run: (work) => ({ ok: true as const, value: work() }) },
      readBootstrap: () => ({ status: 'ready', snapshot: {
        migrationVersion: 1,
        installation: { installedAt: 1, onboardingCompletedAt: null },
        settings: {
          focusDurationMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          defaultMode: 'relax',
          soundEnabled: true,
          hapticsEnabled: true,
          notificationsEnabled: true,
          analyticsEnabled: false,
        },
        profile: { totalXp: 0, coinBalance: 0 },
        catalog: [],
      }, lifecycleState: 'active' }),
      transaction: { execute: vi.fn() },
    });

    await slice.shop.activate();
    expect(run).toHaveBeenCalledOnce();
    expect(slice.shop.getSnapshot()).toMatchObject({
      status: 'error',
      code: 'SHOP_DATA_INVALID',
    });
    slice.dispose();
  });
});
