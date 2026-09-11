import { describe, expect, it, vi } from 'vitest';

import { transactionTechnicalError } from '../ports/transaction.error';
import { SessionCommandCoordinator } from '../onboarding-trial/session-command.coordinator';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import type { CatalogItemRecord } from '../persistence/catalog.repository';
import type { OwnedItemRecord } from '../persistence/owned-item.repository';
import type { ProfileRecord } from '../persistence/profile.repository';
import type { PurchaseReceiptRecord } from '../persistence/purchase-receipt.repository';
import { PurchaseItemUseCase } from './purchase-item.use-case';

const scope: TransactionScope = { transactionId: Symbol('purchase-test') };
const catalog: CatalogItemRecord = {
  id: 'desk-mug',
  displayName: 'Coc ban lam viec',
  category: 'furniture',
  priceCoins: 5,
  catalogVersion: 1,
  createdAt: 1,
  updatedAt: 1,
};

const createHarness = (coinBalance = 5) => {
  let profile: ProfileRecord = {
    id: 1,
    totalXp: 25,
    coinBalance,
    createdAt: 1,
    updatedAt: 1,
  };
  let receipt: PurchaseReceiptRecord | null = null;
  let ownership: OwnedItemRecord | null = null;
  const transaction: TransactionPort = {
    execute: vi.fn(async (work) => work(scope)),
  };
  const dependencies = {
    approvedCatalog: [{
      id: catalog.id,
      displayName: catalog.displayName,
      category: catalog.category,
      priceCoins: catalog.priceCoins,
      catalogVersion: catalog.catalogVersion,
    }],
    catalog: {
      findById: vi.fn(async () => ({ ok: true as const, value: catalog })),
      findByIdInTransaction: vi.fn(async () => ({ ok: true as const, value: catalog })),
    },
    clock: { nowMs: vi.fn(() => 2_000) },
    coordinator: {
      run: async <TValue,>(operation: () => Promise<TValue>): Promise<TValue> => operation(),
    },
    economy: { verify: vi.fn(async () => ({
      ok: true as const,
      value: { profileId: 1, totalXp: profile.totalXp, coinBalance: profile.coinBalance },
    })) },
    id: { nextId: vi.fn(() => 'receipt-1') },
    ownedItems: {
      find: vi.fn(async () => ({ ok: true as const, value: ownership })),
      findInTransaction: vi.fn(async () => ({ ok: true as const, value: ownership })),
      insertInTransaction: vi.fn(async (_scope: TransactionScope, record: OwnedItemRecord) => {
        ownership = record;
        return { ok: true as const, value: undefined };
      }),
    },
    profile: {
      findInTransaction: vi.fn(async () => ({ ok: true as const, value: profile })),
      debitCatalogItemInTransaction: vi.fn(async () => {
        if (profile.coinBalance < catalog.priceCoins) {
          return { ok: true as const, value: 'not_updated' as const };
        }
        profile = { ...profile, coinBalance: profile.coinBalance - catalog.priceCoins, updatedAt: 2_000 };
        return { ok: true as const, value: 'updated' as const };
      }),
    },
    purchases: {
      findByProfileAndItem: vi.fn(async () => ({ ok: true as const, value: receipt })),
      findByProfileAndItemInTransaction: vi.fn(async () => ({ ok: true as const, value: receipt })),
      insertInTransaction: vi.fn(async (_scope: TransactionScope, record: PurchaseReceiptRecord) => {
        receipt = record;
        return { ok: true as const, value: undefined };
      }),
    },
    transaction,
  };
  return {
    dependencies,
    read: () => ({ profile, receipt, ownership }),
    setExisting: (nextReceipt: PurchaseReceiptRecord | null, nextOwnership: OwnedItemRecord | null) => {
      receipt = nextReceipt;
      ownership = nextOwnership;
    },
  };
};

const committedPair = () => {
  const receipt: PurchaseReceiptRecord = {
    id: 'prior-receipt', profileId: 1, itemId: catalog.id, pricePaidCoins: 5,
    coinDelta: -5, reason: 'item_purchase', createdAt: 1_500,
  };
  const ownership: OwnedItemRecord = {
    profileId: 1, itemId: catalog.id, purchaseTransactionId: receipt.id,
    unlockedAt: 1_500, isEquipped: false, equippedAt: null, updatedAt: 1_500,
  };
  return { receipt, ownership };
};

describe('PurchaseItemUseCase', () => {
  it('uses authoritative catalog data to commit an exact-balance purchase unequipped', async () => {
    const harness = createHarness();
    const result = await new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id });

    expect(result).toMatchObject({
      ok: true,
      value: { outcome: 'fresh_commit', coinBalance: 0 },
    });
    expect(harness.read()).toMatchObject({
      profile: { coinBalance: 0 },
      receipt: { id: 'receipt-1', pricePaidCoins: 5, coinDelta: -5 },
      ownership: { purchaseTransactionId: 'receipt-1', isEquipped: false, equippedAt: null },
    });
    expect(harness.dependencies.profile.debitCatalogItemInTransaction)
      .toHaveBeenCalledWith(scope, { profileId: 1, itemId: catalog.id, updatedAt: 2_000 });
  });

  it('returns an exact shortfall and performs zero writes when funds are insufficient', async () => {
    const harness = createHarness(2);
    const result = await new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id });

    expect(result).toEqual({ ok: true, value: {
      outcome: 'insufficient_funds', itemId: catalog.id, priceCoins: 5,
      coinBalance: 2, shortfallCoins: 3,
    } });
    expect(harness.dependencies.profile.debitCatalogItemInTransaction).not.toHaveBeenCalled();
    expect(harness.dependencies.purchases.insertInTransaction).not.toHaveBeenCalled();
    expect(harness.dependencies.ownedItems.insertInTransaction).not.toHaveBeenCalled();
  });

  it('returns already-owned without a second debit for a coherent pair', async () => {
    const harness = createHarness(9);
    const pair = committedPair();
    harness.setExisting(pair.receipt, pair.ownership);
    const result = await new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id });

    expect(result).toMatchObject({ ok: true, value: { outcome: 'already_owned', coinBalance: 9 } });
    expect(harness.dependencies.profile.debitCatalogItemInTransaction).not.toHaveBeenCalled();
  });

  it('rejects one-sided durable purchase facts as corruption', async () => {
    const harness = createHarness();
    harness.setExisting(committedPair().receipt, null);

    await expect(new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id }))
      .resolves.toEqual({
        ok: false, error: { kind: 'purchase_item_error', code: 'PURCHASE_DATA_INVALID' },
      });
  });

  it('recovers an ambiguous commit by the generated receipt identity', async () => {
    const harness = createHarness(0);
    const receipt: PurchaseReceiptRecord = {
      ...committedPair().receipt, id: 'receipt-1', createdAt: 2_000,
    };
    const ownership: OwnedItemRecord = {
      ...committedPair().ownership,
      purchaseTransactionId: receipt.id, unlockedAt: 2_000, updatedAt: 2_000,
    };
    harness.setExisting(receipt, ownership);
    harness.dependencies.transaction.execute = vi.fn(async () => ({
      ok: false as const,
      error: transactionTechnicalError('TRANSACTION_COMMIT_FAILED'),
    }));

    const result = await new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id });
    expect(result).toMatchObject({
      ok: true,
      value: { outcome: 'recovery_commit', receipt: { id: 'receipt-1' }, coinBalance: 0 },
    });
  });

  it('does not claim a commit when ambiguous readback proves all purchase facts absent', async () => {
    const harness = createHarness();
    harness.dependencies.transaction.execute = vi.fn(async () => ({
      ok: false as const,
      error: transactionTechnicalError('TRANSACTION_COMMIT_FAILED'),
    }));

    await expect(new PurchaseItemUseCase(harness.dependencies).execute({ itemId: catalog.id }))
      .resolves.toEqual({
        ok: false, error: { kind: 'purchase_item_error', code: 'PURCHASE_TRANSACTION_FAILED' },
      });
  });

  it('serializes concurrent same-item attempts into one debit and one already-owned result', async () => {
    const harness = createHarness();
    harness.dependencies.coordinator = new SessionCommandCoordinator();
    const useCase = new PurchaseItemUseCase(harness.dependencies);

    const results = await Promise.all([
      useCase.execute({ itemId: catalog.id }),
      useCase.execute({ itemId: catalog.id }),
    ]);
    expect(results.map((result) => result.ok ? result.value.outcome : 'error'))
      .toEqual(['fresh_commit', 'already_owned']);
    expect(harness.dependencies.profile.debitCatalogItemInTransaction).toHaveBeenCalledOnce();
    expect(harness.dependencies.purchases.insertInTransaction).toHaveBeenCalledOnce();
    expect(harness.dependencies.ownedItems.insertInTransaction).toHaveBeenCalledOnce();
  });
});
