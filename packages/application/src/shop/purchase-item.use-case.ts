import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { CatalogItemRecord, CatalogRepository } from '../persistence/catalog.repository';
import type { EconomyConsistencyQuery } from '../persistence/derived-query';
import type { OwnedItemRecord, OwnedItemRepository } from '../persistence/owned-item.repository';
import type { PersistenceError } from '../persistence/persistence.error';
import type { ProfileRecord, ProfileRepository } from '../persistence/profile.repository';
import type {
  PurchaseReceiptRecord,
  PurchaseReceiptRepository,
} from '../persistence/purchase-receipt.repository';
import type { ApplicationResult } from '../result/application-result';
import type { ApprovedShopCatalogItem } from './load-shop-projection.use-case';

const MVP_PROFILE_ID = 1;

export interface PurchaseItemInput {
  readonly itemId: string;
}

export type PurchaseItemOutcome =
  | {
      readonly outcome: 'fresh_commit' | 'recovery_commit' | 'already_owned';
      readonly receipt: PurchaseReceiptRecord;
      readonly ownership: OwnedItemRecord;
      readonly coinBalance: number;
    }
  | {
      readonly outcome: 'insufficient_funds';
      readonly itemId: string;
      readonly priceCoins: number;
      readonly coinBalance: number;
      readonly shortfallCoins: number;
    };

export type PurchaseItemErrorCode =
  | 'PURCHASE_ITEM_ID_INVALID'
  | 'PURCHASE_ITEM_UNAVAILABLE'
  | 'PURCHASE_PROFILE_INVALID'
  | 'PURCHASE_DATA_INVALID'
  | 'PURCHASE_READ_FAILED'
  | 'PURCHASE_WRITE_FAILED'
  | 'PURCHASE_TRANSACTION_FAILED'
  | 'PURCHASE_RESULT_READ_FAILED';

export interface PurchaseItemError {
  readonly kind: 'purchase_item_error';
  readonly code: PurchaseItemErrorCode;
}

export interface PurchaseItemDependencies {
  readonly approvedCatalog: readonly ApprovedShopCatalogItem[];
  readonly catalog: Pick<CatalogRepository, 'findById' | 'findByIdInTransaction'>;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly economy: EconomyConsistencyQuery;
  readonly id: IdPort;
  readonly ownedItems: Pick<
    OwnedItemRepository,
    'find' | 'findInTransaction' | 'insertInTransaction'
  >;
  readonly profile: Pick<
    ProfileRepository,
    'findInTransaction' | 'debitCatalogItemInTransaction'
  >;
  readonly purchases: Pick<
    PurchaseReceiptRepository,
    | 'findByProfileAndItem'
    | 'findByProfileAndItemInTransaction'
    | 'insertInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: PurchaseItemErrorCode,
): ApplicationResult<never, PurchaseItemError> => ({
  ok: false,
  error: { kind: 'purchase_item_error', code },
});

const validIdentity = (value: string): boolean =>
  value.length > 0 && value.trim() === value;
const validTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;
const validProfile = (profile: ProfileRecord): boolean =>
  profile.id === MVP_PROFILE_ID && Number.isSafeInteger(profile.totalXp) &&
  profile.totalXp >= 0 && Number.isSafeInteger(profile.coinBalance) &&
  profile.coinBalance >= 0 && validTimestamp(profile.createdAt) &&
  validTimestamp(profile.updatedAt);

const approvedItemFor = (
  catalog: readonly ApprovedShopCatalogItem[],
  itemId: string,
): ApprovedShopCatalogItem | null => {
  const matches = catalog.filter(({ id }) => id === itemId);
  const item = matches[0];
  if (
    matches.length !== 1 || item === undefined || !validIdentity(item.id) ||
    !validIdentity(item.displayName) || item.category !== 'furniture' ||
    !Number.isSafeInteger(item.priceCoins) || item.priceCoins <= 0 ||
    !Number.isSafeInteger(item.catalogVersion) || item.catalogVersion <= 0
  ) return null;
  return item;
};

const catalogMatches = (
  actual: CatalogItemRecord,
  expected: ApprovedShopCatalogItem,
): boolean => actual.id === expected.id && actual.displayName === expected.displayName &&
  actual.category === expected.category && actual.priceCoins === expected.priceCoins &&
  actual.catalogVersion === expected.catalogVersion && validTimestamp(actual.createdAt) &&
  validTimestamp(actual.updatedAt);

const coherentOwnership = (
  receipt: PurchaseReceiptRecord,
  ownership: OwnedItemRecord,
  item: ApprovedShopCatalogItem,
): boolean => receipt.profileId === MVP_PROFILE_ID && receipt.itemId === item.id &&
  receipt.pricePaidCoins === item.priceCoins && receipt.coinDelta === -item.priceCoins &&
  receipt.reason === 'item_purchase' && validIdentity(receipt.id) &&
  validTimestamp(receipt.createdAt) && ownership.profileId === MVP_PROFILE_ID &&
  ownership.itemId === item.id && ownership.purchaseTransactionId === receipt.id &&
  validTimestamp(ownership.unlockedAt) && validTimestamp(ownership.updatedAt) &&
  (ownership.isEquipped
    ? ownership.equippedAt !== null && validTimestamp(ownership.equippedAt)
    : ownership.equippedAt === null);

const readFailure = (
  error: PersistenceError,
  fallback: 'PURCHASE_READ_FAILED' | 'PURCHASE_RESULT_READ_FAILED',
): ApplicationResult<never, PurchaseItemError> => failure(
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
    ? 'PURCHASE_DATA_INVALID'
    : fallback,
);

export class PurchaseItemUseCase {
  constructor(private readonly dependencies: PurchaseItemDependencies) {}

  async execute(
    input: PurchaseItemInput,
  ): Promise<ApplicationResult<PurchaseItemOutcome, PurchaseItemError>> {
    if (!validIdentity(input.itemId)) return failure('PURCHASE_ITEM_ID_INVALID');
    try {
      return await this.dependencies.coordinator.run(
        () => this.executeSerialized(input.itemId),
      );
    } catch {
      return failure('PURCHASE_TRANSACTION_FAILED');
    }
  }

  private async executeSerialized(
    itemId: string,
  ): Promise<ApplicationResult<PurchaseItemOutcome, PurchaseItemError>> {
    const approved = approvedItemFor(this.dependencies.approvedCatalog, itemId);
    if (approved === null) return failure('PURCHASE_ITEM_UNAVAILABLE');

    let receiptId: string;
    let createdAt: number;
    try {
      receiptId = this.dependencies.id.nextId();
      createdAt = this.dependencies.clock.nowMs();
    } catch {
      return failure('PURCHASE_TRANSACTION_FAILED');
    }
    if (!validIdentity(receiptId) || !validTimestamp(createdAt)) {
      return failure('PURCHASE_TRANSACTION_FAILED');
    }

    const result = await this.dependencies.transaction.execute<
      PurchaseItemOutcome,
      PurchaseItemError
    >(async (scope) => {
      const catalog = await this.dependencies.catalog.findByIdInTransaction(scope, itemId);
      if (!catalog.ok) return readFailure(catalog.error, 'PURCHASE_READ_FAILED');
      if (catalog.value === null) return failure('PURCHASE_ITEM_UNAVAILABLE');
      if (!catalogMatches(catalog.value, approved)) return failure('PURCHASE_DATA_INVALID');

      const profile = await this.dependencies.profile.findInTransaction(scope);
      if (!profile.ok) return readFailure(profile.error, 'PURCHASE_READ_FAILED');
      if (profile.value === null || !validProfile(profile.value)) {
        return failure('PURCHASE_PROFILE_INVALID');
      }
      const existingReceipt = await this.dependencies.purchases
        .findByProfileAndItemInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!existingReceipt.ok) {
        return readFailure(existingReceipt.error, 'PURCHASE_READ_FAILED');
      }
      const existingOwnership = await this.dependencies.ownedItems
        .findInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!existingOwnership.ok) {
        return readFailure(existingOwnership.error, 'PURCHASE_READ_FAILED');
      }
      if (existingReceipt.value !== null || existingOwnership.value !== null) {
        if (
          existingReceipt.value === null || existingOwnership.value === null ||
          !coherentOwnership(existingReceipt.value, existingOwnership.value, approved)
        ) return failure('PURCHASE_DATA_INVALID');
        return {
          ok: true,
          value: Object.freeze({
            outcome: 'already_owned' as const,
            receipt: existingReceipt.value,
            ownership: existingOwnership.value,
            coinBalance: profile.value.coinBalance,
          }),
        };
      }
      if (profile.value.coinBalance < approved.priceCoins) {
        return {
          ok: true,
          value: Object.freeze({
            outcome: 'insufficient_funds' as const,
            itemId,
            priceCoins: approved.priceCoins,
            coinBalance: profile.value.coinBalance,
            shortfallCoins: approved.priceCoins - profile.value.coinBalance,
          }),
        };
      }

      const debited = await this.dependencies.profile.debitCatalogItemInTransaction(scope, {
        profileId: MVP_PROFILE_ID,
        itemId,
        updatedAt: createdAt,
      });
      if (!debited.ok || debited.value !== 'updated') return failure('PURCHASE_WRITE_FAILED');
      const receipt: PurchaseReceiptRecord = Object.freeze({
        id: receiptId,
        profileId: MVP_PROFILE_ID,
        itemId,
        pricePaidCoins: approved.priceCoins,
        coinDelta: -approved.priceCoins,
        reason: 'item_purchase',
        createdAt,
      });
      const receiptInserted = await this.dependencies.purchases.insertInTransaction(scope, receipt);
      if (!receiptInserted.ok) return failure('PURCHASE_WRITE_FAILED');
      const ownership: OwnedItemRecord = Object.freeze({
        profileId: MVP_PROFILE_ID,
        itemId,
        purchaseTransactionId: receiptId,
        unlockedAt: createdAt,
        isEquipped: false,
        equippedAt: null,
        updatedAt: createdAt,
      });
      const ownershipInserted = await this.dependencies.ownedItems
        .insertInTransaction(scope, ownership);
      if (!ownershipInserted.ok) return failure('PURCHASE_WRITE_FAILED');

      const committedProfile = await this.dependencies.profile.findInTransaction(scope);
      const committedReceipt = await this.dependencies.purchases
        .findByProfileAndItemInTransaction(scope, MVP_PROFILE_ID, itemId);
      const committedOwnership = await this.dependencies.ownedItems
        .findInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!committedProfile.ok || !committedReceipt.ok || !committedOwnership.ok) {
        return failure('PURCHASE_READ_FAILED');
      }
      if (
        committedProfile.value === null || !validProfile(committedProfile.value) ||
        committedProfile.value.totalXp !== profile.value.totalXp ||
        committedProfile.value.coinBalance !== profile.value.coinBalance - approved.priceCoins ||
        committedReceipt.value === null || committedReceipt.value.id !== receiptId ||
        committedOwnership.value === null ||
        !coherentOwnership(committedReceipt.value, committedOwnership.value, approved)
      ) return failure('PURCHASE_DATA_INVALID');

      return {
        ok: true,
        value: Object.freeze({
          outcome: 'fresh_commit' as const,
          receipt: committedReceipt.value,
          ownership: committedOwnership.value,
          coinBalance: committedProfile.value.coinBalance,
        }),
      };
    });

    if (result.ok) return result;
    if (result.error.kind === 'purchase_item_error') {
      return { ok: false, error: result.error };
    }
    return this.recoverAfterTechnicalResult(approved, receiptId);
  }

  private async recoverAfterTechnicalResult(
    approved: ApprovedShopCatalogItem,
    receiptId: string,
  ): Promise<ApplicationResult<PurchaseItemOutcome, PurchaseItemError>> {
    const [catalog, receipt, ownership, economy] = await Promise.all([
      this.dependencies.catalog.findById(approved.id),
      this.dependencies.purchases.findByProfileAndItem(MVP_PROFILE_ID, approved.id),
      this.dependencies.ownedItems.find(MVP_PROFILE_ID, approved.id),
      this.dependencies.economy.verify(MVP_PROFILE_ID),
    ]);
    if (!catalog.ok) return readFailure(catalog.error, 'PURCHASE_RESULT_READ_FAILED');
    if (!receipt.ok) return readFailure(receipt.error, 'PURCHASE_RESULT_READ_FAILED');
    if (!ownership.ok) return readFailure(ownership.error, 'PURCHASE_RESULT_READ_FAILED');
    if (!economy.ok) return readFailure(economy.error, 'PURCHASE_RESULT_READ_FAILED');
    if (catalog.value === null || !catalogMatches(catalog.value, approved)) {
      return failure('PURCHASE_DATA_INVALID');
    }
    if (receipt.value === null && ownership.value === null) {
      return failure('PURCHASE_TRANSACTION_FAILED');
    }
    if (
      receipt.value === null || ownership.value === null ||
      !coherentOwnership(receipt.value, ownership.value, approved) ||
      economy.value.profileId !== MVP_PROFILE_ID ||
      !Number.isSafeInteger(economy.value.coinBalance) || economy.value.coinBalance < 0
    ) return failure('PURCHASE_DATA_INVALID');
    return {
      ok: true,
      value: Object.freeze({
        outcome: receipt.value.id === receiptId ? 'recovery_commit' : 'already_owned',
        receipt: receipt.value,
        ownership: ownership.value,
        coinBalance: economy.value.coinBalance,
      }),
    };
  }
}
