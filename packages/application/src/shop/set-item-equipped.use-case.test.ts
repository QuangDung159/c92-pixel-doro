import { describe, expect, it, vi } from 'vitest';

import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import { transactionTechnicalError } from '../ports/transaction.error';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import type { CatalogItemRecord } from '../persistence/catalog.repository';
import type { OwnedItemRecord } from '../persistence/owned-item.repository';
import type { PurchaseReceiptRecord } from '../persistence/purchase-receipt.repository';
import { SetItemEquippedUseCase } from './set-item-equipped.use-case';

const scope: TransactionScope = { transactionId: Symbol('equip-test') };
const catalog: CatalogItemRecord = {
  id: 'desk-mug', displayName: 'Cốc trên bàn', category: 'furniture',
  priceCoins: 5, catalogVersion: 1, createdAt: 1, updatedAt: 1,
};
const receipt: PurchaseReceiptRecord = {
  id: 'receipt-1', profileId: 1, itemId: catalog.id, pricePaidCoins: 5,
  coinDelta: -5, reason: 'item_purchase', createdAt: 100,
};
const unequipped: OwnedItemRecord = {
  profileId: 1, itemId: catalog.id, purchaseTransactionId: receipt.id,
  unlockedAt: 100, isEquipped: false, equippedAt: null, updatedAt: 100,
};

const createHarness = (initial: OwnedItemRecord | null = unequipped) => {
  let ownership = initial;
  let durableReceipt: PurchaseReceiptRecord | null = initial === null ? null : receipt;
  const transaction: TransactionPort = { execute: vi.fn(async (work) => work(scope)) };
  const dependencies = {
    approvedCatalog: [{
      id: catalog.id, displayName: catalog.displayName, category: catalog.category,
      priceCoins: catalog.priceCoins, catalogVersion: catalog.catalogVersion,
    }],
    catalog: {
      findById: vi.fn(async () => ({ ok: true as const, value: catalog })),
      findByIdInTransaction: vi.fn(async () => ({ ok: true as const, value: catalog })),
    },
    clock: { nowMs: vi.fn(() => 200) },
    coordinator: new SessionCommandCoordinator(),
    ownedItems: {
      find: vi.fn(async () => ({ ok: true as const, value: ownership })),
      findInTransaction: vi.fn(async () => ({ ok: true as const, value: ownership })),
      setEquippedInTransaction: vi.fn(async (
        _scope: TransactionScope,
        input: { isEquipped: boolean; equippedAt: number | null; updatedAt: number },
      ) => {
        if (ownership === null) return { ok: true as const, value: 'not_updated' as const };
        ownership = {
          ...ownership,
          isEquipped: input.isEquipped,
          equippedAt: input.equippedAt,
          updatedAt: input.updatedAt,
        };
        return { ok: true as const, value: 'updated' as const };
      }),
    },
    purchases: {
      findByProfileAndItem: vi.fn(async () => ({ ok: true as const, value: durableReceipt })),
      findByProfileAndItemInTransaction: vi.fn(async () => ({
        ok: true as const, value: durableReceipt,
      })),
    },
    transaction,
  };
  return {
    dependencies,
    read: () => ownership,
    setDurable: (nextOwnership: OwnedItemRecord | null, nextReceipt: PurchaseReceiptRecord | null) => {
      ownership = nextOwnership;
      durableReceipt = nextReceipt;
    },
  };
};

describe('SetItemEquippedUseCase', () => {
  it('equips one owned row with the exact transition timestamp', async () => {
    const harness = createHarness();
    const result = await new SetItemEquippedUseCase(harness.dependencies).execute({
      itemId: catalog.id, isEquipped: true,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: 'fresh_commit', transition: 'equipped',
        ownership: { isEquipped: true, equippedAt: 200, updatedAt: 200 },
      },
    });
    expect(harness.dependencies.ownedItems.setEquippedInTransaction).toHaveBeenCalledWith(scope, {
      profileId: 1, itemId: catalog.id, isEquipped: true, equippedAt: 200, updatedAt: 200,
    });
  });

  it('unequips without deleting ownership and clears equippedAt', async () => {
    const harness = createHarness({
      ...unequipped, isEquipped: true, equippedAt: 150, updatedAt: 150,
    });
    const result = await new SetItemEquippedUseCase(harness.dependencies).execute({
      itemId: catalog.id, isEquipped: false,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: 'fresh_commit', transition: 'unequipped',
        ownership: { purchaseTransactionId: receipt.id, isEquipped: false, equippedAt: null },
      },
    });
  });

  it('preserves timestamps and performs zero writes for the same desired state', async () => {
    const harness = createHarness();
    const result = await new SetItemEquippedUseCase(harness.dependencies).execute({
      itemId: catalog.id, isEquipped: false,
    });
    expect(result).toEqual({ ok: true, value: {
      outcome: 'already_in_state', ownership: unequipped,
    } });
    expect(harness.dependencies.ownedItems.setEquippedInTransaction).not.toHaveBeenCalled();
    expect(harness.read()?.updatedAt).toBe(100);
  });

  it('rejects unowned and one-sided durable facts with zero mutation', async () => {
    const unowned = createHarness(null);
    await expect(new SetItemEquippedUseCase(unowned.dependencies).execute({
      itemId: catalog.id, isEquipped: true,
    })).resolves.toEqual({ ok: true, value: { outcome: 'not_owned', itemId: catalog.id } });
    expect(unowned.dependencies.ownedItems.setEquippedInTransaction).not.toHaveBeenCalled();

    const corrupt = createHarness();
    corrupt.setDurable(unequipped, null);
    await expect(new SetItemEquippedUseCase(corrupt.dependencies).execute({
      itemId: catalog.id, isEquipped: true,
    })).resolves.toMatchObject({
      ok: false, error: { code: 'SET_EQUIPPED_DATA_INVALID' },
    });
  });

  it('recovers an ambiguous commit only by the exact attempt timestamp', async () => {
    const harness = createHarness();
    harness.dependencies.transaction.execute = vi.fn(async (work) => {
      await work(scope);
      return { ok: false as const, error: transactionTechnicalError('TRANSACTION_COMMIT_FAILED') };
    });
    const result = await new SetItemEquippedUseCase(harness.dependencies).execute({
      itemId: catalog.id, isEquipped: true,
    });
    expect(result).toMatchObject({
      ok: true, value: { outcome: 'recovery_commit', transition: 'equipped' },
    });
  });

  it('serializes concurrent opposite transitions in accepted order', async () => {
    const harness = createHarness();
    const useCase = new SetItemEquippedUseCase(harness.dependencies);
    const results = await Promise.all([
      useCase.execute({ itemId: catalog.id, isEquipped: true }),
      useCase.execute({ itemId: catalog.id, isEquipped: false }),
    ]);
    expect(results.map((result) => result.ok ? result.value.outcome : 'error'))
      .toEqual(['fresh_commit', 'fresh_commit']);
    expect(harness.read()).toMatchObject({ isEquipped: false, equippedAt: null });
    expect(harness.dependencies.ownedItems.setEquippedInTransaction).toHaveBeenCalledTimes(2);
  });
});
