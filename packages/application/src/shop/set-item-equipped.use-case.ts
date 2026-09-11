import type { SessionCommandCoordinatorPort } from '../onboarding-trial/session-command.coordinator';
import type { ClockPort } from '../ports/clock.port';
import type { TransactionPort } from '../ports/transaction.port';
import type { CatalogItemRecord, CatalogRepository } from '../persistence/catalog.repository';
import type { OwnedItemRecord, OwnedItemRepository } from '../persistence/owned-item.repository';
import type { PersistenceError } from '../persistence/persistence.error';
import type {
  PurchaseReceiptRecord,
  PurchaseReceiptRepository,
} from '../persistence/purchase-receipt.repository';
import type { ApplicationResult } from '../result/application-result';
import type { ApprovedShopCatalogItem } from './load-shop-projection.use-case';

const MVP_PROFILE_ID = 1;

export interface SetItemEquippedInput {
  readonly itemId: string;
  readonly isEquipped: boolean;
}

export type SetItemEquippedOutcome =
  | {
      readonly outcome: 'fresh_commit' | 'recovery_commit';
      readonly transition: 'equipped' | 'unequipped';
      readonly ownership: OwnedItemRecord;
    }
  | {
      readonly outcome: 'already_in_state';
      readonly ownership: OwnedItemRecord;
    }
  | {
      readonly outcome: 'not_owned';
      readonly itemId: string;
    };

export type SetItemEquippedErrorCode =
  | 'SET_EQUIPPED_ITEM_ID_INVALID'
  | 'SET_EQUIPPED_DESIRED_STATE_INVALID'
  | 'SET_EQUIPPED_ITEM_UNAVAILABLE'
  | 'SET_EQUIPPED_DATA_INVALID'
  | 'SET_EQUIPPED_READ_FAILED'
  | 'SET_EQUIPPED_WRITE_FAILED'
  | 'SET_EQUIPPED_TRANSACTION_FAILED'
  | 'SET_EQUIPPED_RESULT_READ_FAILED';

export interface SetItemEquippedError {
  readonly kind: 'set_item_equipped_error';
  readonly code: SetItemEquippedErrorCode;
}

export interface SetItemEquippedDependencies {
  readonly approvedCatalog: readonly ApprovedShopCatalogItem[];
  readonly catalog: Pick<CatalogRepository, 'findById' | 'findByIdInTransaction'>;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly ownedItems: Pick<
    OwnedItemRepository,
    'find' | 'findInTransaction' | 'setEquippedInTransaction'
  >;
  readonly purchases: Pick<
    PurchaseReceiptRepository,
    'findByProfileAndItem' | 'findByProfileAndItemInTransaction'
  >;
  readonly transaction: TransactionPort;
}

const failure = (
  code: SetItemEquippedErrorCode,
): ApplicationResult<never, SetItemEquippedError> => ({
  ok: false,
  error: { kind: 'set_item_equipped_error', code },
});

const validIdentity = (value: string): boolean =>
  value.length > 0 && value.trim() === value;
const validTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

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

const sameImmutableOwnership = (
  before: OwnedItemRecord,
  after: OwnedItemRecord,
): boolean => before.profileId === after.profileId && before.itemId === after.itemId &&
  before.purchaseTransactionId === after.purchaseTransactionId &&
  before.unlockedAt === after.unlockedAt;

const readFailure = (
  error: PersistenceError,
  fallback: 'SET_EQUIPPED_READ_FAILED' | 'SET_EQUIPPED_RESULT_READ_FAILED',
): ApplicationResult<never, SetItemEquippedError> => failure(
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
    ? 'SET_EQUIPPED_DATA_INVALID'
    : fallback,
);

export class SetItemEquippedUseCase {
  constructor(private readonly dependencies: SetItemEquippedDependencies) {}

  async execute(
    input: SetItemEquippedInput,
  ): Promise<ApplicationResult<SetItemEquippedOutcome, SetItemEquippedError>> {
    if (!validIdentity(input.itemId)) return failure('SET_EQUIPPED_ITEM_ID_INVALID');
    if (typeof input.isEquipped !== 'boolean') {
      return failure('SET_EQUIPPED_DESIRED_STATE_INVALID');
    }
    try {
      return await this.dependencies.coordinator.run(
        () => this.executeSerialized(input.itemId, input.isEquipped),
      );
    } catch {
      return failure('SET_EQUIPPED_TRANSACTION_FAILED');
    }
  }

  private async executeSerialized(
    itemId: string,
    isEquipped: boolean,
  ): Promise<ApplicationResult<SetItemEquippedOutcome, SetItemEquippedError>> {
    const approved = approvedItemFor(this.dependencies.approvedCatalog, itemId);
    if (approved === null) return failure('SET_EQUIPPED_ITEM_UNAVAILABLE');
    let updatedAt: number;
    try {
      updatedAt = this.dependencies.clock.nowMs();
    } catch {
      return failure('SET_EQUIPPED_TRANSACTION_FAILED');
    }
    if (!validTimestamp(updatedAt)) return failure('SET_EQUIPPED_TRANSACTION_FAILED');

    let before: OwnedItemRecord | null = null;
    const result = await this.dependencies.transaction.execute<
      SetItemEquippedOutcome,
      SetItemEquippedError
    >(async (scope) => {
      const catalog = await this.dependencies.catalog.findByIdInTransaction(scope, itemId);
      if (!catalog.ok) return readFailure(catalog.error, 'SET_EQUIPPED_READ_FAILED');
      if (catalog.value === null) return failure('SET_EQUIPPED_ITEM_UNAVAILABLE');
      if (!catalogMatches(catalog.value, approved)) return failure('SET_EQUIPPED_DATA_INVALID');

      const ownership = await this.dependencies.ownedItems
        .findInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!ownership.ok) return readFailure(ownership.error, 'SET_EQUIPPED_READ_FAILED');
      const receipt = await this.dependencies.purchases
        .findByProfileAndItemInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!receipt.ok) return readFailure(receipt.error, 'SET_EQUIPPED_READ_FAILED');
      if (ownership.value === null && receipt.value === null) {
        return { ok: true, value: { outcome: 'not_owned', itemId } };
      }
      if (
        ownership.value === null || receipt.value === null ||
        !coherentOwnership(receipt.value, ownership.value, approved)
      ) return failure('SET_EQUIPPED_DATA_INVALID');
      before = ownership.value;
      if (ownership.value.isEquipped === isEquipped) {
        return { ok: true, value: {
          outcome: 'already_in_state',
          ownership: ownership.value,
        } };
      }

      const written = await this.dependencies.ownedItems.setEquippedInTransaction(scope, {
        profileId: MVP_PROFILE_ID,
        itemId,
        isEquipped,
        equippedAt: isEquipped ? updatedAt : null,
        updatedAt,
      });
      if (!written.ok || written.value !== 'updated') {
        return failure('SET_EQUIPPED_WRITE_FAILED');
      }
      const committedOwnership = await this.dependencies.ownedItems
        .findInTransaction(scope, MVP_PROFILE_ID, itemId);
      const committedReceipt = await this.dependencies.purchases
        .findByProfileAndItemInTransaction(scope, MVP_PROFILE_ID, itemId);
      if (!committedOwnership.ok || !committedReceipt.ok) {
        return failure('SET_EQUIPPED_READ_FAILED');
      }
      if (
        committedOwnership.value === null || committedReceipt.value === null ||
        !coherentOwnership(committedReceipt.value, committedOwnership.value, approved) ||
        !sameImmutableOwnership(ownership.value, committedOwnership.value) ||
        committedOwnership.value.isEquipped !== isEquipped ||
        committedOwnership.value.updatedAt !== updatedAt ||
        committedOwnership.value.equippedAt !== (isEquipped ? updatedAt : null)
      ) return failure('SET_EQUIPPED_DATA_INVALID');
      return { ok: true, value: {
        outcome: 'fresh_commit',
        transition: isEquipped ? 'equipped' : 'unequipped',
        ownership: committedOwnership.value,
      } };
    });

    if (result.ok) return result;
    if (result.error.kind === 'set_item_equipped_error') {
      return { ok: false, error: result.error };
    }
    return this.recoverAfterTechnicalResult(approved, before, isEquipped, updatedAt);
  }

  private async recoverAfterTechnicalResult(
    approved: ApprovedShopCatalogItem,
    before: OwnedItemRecord | null,
    isEquipped: boolean,
    updatedAt: number,
  ): Promise<ApplicationResult<SetItemEquippedOutcome, SetItemEquippedError>> {
    const [catalog, ownership, receipt] = await Promise.all([
      this.dependencies.catalog.findById(approved.id),
      this.dependencies.ownedItems.find(MVP_PROFILE_ID, approved.id),
      this.dependencies.purchases.findByProfileAndItem(MVP_PROFILE_ID, approved.id),
    ]);
    if (!catalog.ok) return readFailure(catalog.error, 'SET_EQUIPPED_RESULT_READ_FAILED');
    if (!ownership.ok) return readFailure(ownership.error, 'SET_EQUIPPED_RESULT_READ_FAILED');
    if (!receipt.ok) return readFailure(receipt.error, 'SET_EQUIPPED_RESULT_READ_FAILED');
    if (catalog.value === null || !catalogMatches(catalog.value, approved)) {
      return failure('SET_EQUIPPED_DATA_INVALID');
    }
    if (ownership.value === null && receipt.value === null) {
      return { ok: true, value: { outcome: 'not_owned', itemId: approved.id } };
    }
    if (
      ownership.value === null || receipt.value === null ||
      !coherentOwnership(receipt.value, ownership.value, approved)
    ) return failure('SET_EQUIPPED_DATA_INVALID');
    if (before === null) {
      return ownership.value.isEquipped === isEquipped
        ? { ok: true, value: { outcome: 'already_in_state', ownership: ownership.value } }
        : failure('SET_EQUIPPED_TRANSACTION_FAILED');
    }
    if (!sameImmutableOwnership(before, ownership.value)) {
      return failure('SET_EQUIPPED_DATA_INVALID');
    }
    if (
      ownership.value.isEquipped === before.isEquipped &&
      ownership.value.equippedAt === before.equippedAt &&
      ownership.value.updatedAt === before.updatedAt
    ) return failure('SET_EQUIPPED_TRANSACTION_FAILED');
    if (
      ownership.value.isEquipped !== isEquipped ||
      ownership.value.updatedAt !== updatedAt ||
      ownership.value.equippedAt !== (isEquipped ? updatedAt : null)
    ) return failure('SET_EQUIPPED_DATA_INVALID');
    return { ok: true, value: {
      outcome: 'recovery_commit',
      transition: isEquipped ? 'equipped' : 'unequipped',
      ownership: ownership.value,
    } };
  }
}
