import type { HomeProfileProjection } from '../home/create-home-profile.projection';
import { createHomeProfileProjection } from '../home/create-home-profile.projection';
import type { CatalogItemRecord, CatalogRepository } from '../persistence/catalog.repository';
import type { EconomyConsistencyQuery } from '../persistence/derived-query';
import type { OwnedItemRecord, OwnedItemRepository } from '../persistence/owned-item.repository';
import type { PersistenceError } from '../persistence/persistence.error';
import type { ApplicationResult } from '../result/application-result';

const MVP_PROFILE_ID = 1;

export interface ApprovedShopCatalogItem {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
  readonly catalogVersion: number;
}

export type ShopItemState = 'available' | 'owned' | 'equipped';

export interface ShopItemProjection {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
  readonly state: ShopItemState;
}

export interface ShopProjection {
  readonly profile: HomeProfileProjection;
  readonly items: readonly ShopItemProjection[];
}

export type LoadShopProjectionErrorCode =
  | 'SHOP_READ_FAILED'
  | 'SHOP_ECONOMY_INCONSISTENT'
  | 'SHOP_PROFILE_INVALID'
  | 'SHOP_CATALOG_INVALID'
  | 'SHOP_OWNERSHIP_INVALID';

export interface LoadShopProjectionError {
  readonly kind: 'load_shop_projection_error';
  readonly code: LoadShopProjectionErrorCode;
}

export interface LoadShopProjectionDependencies {
  readonly economy: EconomyConsistencyQuery;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  readonly ownedItems: Pick<OwnedItemRepository, 'listByProfile'>;
  readonly approvedCatalog: readonly ApprovedShopCatalogItem[];
}

const failure = (
  code: LoadShopProjectionErrorCode,
): ApplicationResult<never, LoadShopProjectionError> => ({
  ok: false,
  error: { kind: 'load_shop_projection_error', code },
});

const isNonEmpty = (value: string): boolean => value.trim().length > 0;
const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

const uniqueIds = (items: readonly { readonly id: string }[]): boolean =>
  new Set(items.map(({ id }) => id)).size === items.length;

const validApprovedCatalog = (
  catalog: readonly ApprovedShopCatalogItem[],
): boolean => catalog.length > 0 && uniqueIds(catalog) && catalog.every((item, index) => {
  const previous = catalog[index - 1];
  return isNonEmpty(item.id) && isNonEmpty(item.displayName) &&
    item.category === 'furniture' && Number.isSafeInteger(item.priceCoins) &&
    item.priceCoins > 0 && Number.isSafeInteger(item.catalogVersion) &&
    item.catalogVersion > 0 && (previous === undefined ||
      previous.priceCoins < item.priceCoins ||
      (previous.priceCoins === item.priceCoins && previous.id < item.id));
});

const validCatalog = (
  actual: readonly CatalogItemRecord[],
  approved: readonly ApprovedShopCatalogItem[],
): boolean => actual.length === approved.length && uniqueIds(actual) &&
  actual.every((item, index) => {
    const expected = approved[index];
    return expected !== undefined && item.id === expected.id &&
      item.displayName === expected.displayName && item.category === expected.category &&
      item.priceCoins === expected.priceCoins && item.catalogVersion === expected.catalogVersion;
  });

const validOwnedItems = (
  ownedItems: readonly OwnedItemRecord[],
  catalogIds: ReadonlySet<string>,
): boolean => {
  const identities = new Set<string>();
  return ownedItems.every((item) => {
    if (
      item.profileId !== MVP_PROFILE_ID || !catalogIds.has(item.itemId) ||
      !isNonEmpty(item.purchaseTransactionId) || !isSafeTimestamp(item.unlockedAt) ||
      !isSafeTimestamp(item.updatedAt) ||
      (item.isEquipped
        ? item.equippedAt === null || !isSafeTimestamp(item.equippedAt)
        : item.equippedAt !== null) ||
      identities.has(item.itemId)
    ) return false;
    identities.add(item.itemId);
    return true;
  });
};

const readErrorCode = (
  error: PersistenceError,
  corruptCode: LoadShopProjectionErrorCode,
): LoadShopProjectionErrorCode =>
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
    ? corruptCode
    : 'SHOP_READ_FAILED';

const freezeProjection = (
  profile: HomeProfileProjection,
  catalog: readonly CatalogItemRecord[],
  ownedItems: readonly OwnedItemRecord[],
): ShopProjection => {
  const ownership = new Map(ownedItems.map((item) => [item.itemId, item]));
  const items = catalog.map((item): ShopItemProjection => {
    const owned = ownership.get(item.id);
    return Object.freeze({
      id: item.id,
      displayName: item.displayName,
      category: item.category,
      priceCoins: item.priceCoins,
      state: owned === undefined ? 'available' : owned.isEquipped ? 'equipped' : 'owned',
    });
  });
  Object.freeze(items);
  return Object.freeze({ profile, items });
};

export class LoadShopProjectionUseCase {
  constructor(private readonly dependencies: LoadShopProjectionDependencies) {}

  async execute(): Promise<
    ApplicationResult<ShopProjection, LoadShopProjectionError>
  > {
    try {
      if (!validApprovedCatalog(this.dependencies.approvedCatalog)) {
        return failure('SHOP_CATALOG_INVALID');
      }

      const economy = await this.dependencies.economy.verify(MVP_PROFILE_ID);
      if (!economy.ok) {
        return failure(
          economy.error.code === 'PERSISTENCE_INVARIANT_MISMATCH'
            ? 'SHOP_ECONOMY_INCONSISTENT'
            : readErrorCode(economy.error, 'SHOP_PROFILE_INVALID'),
        );
      }
      if (
        economy.value.profileId !== MVP_PROFILE_ID ||
        !Number.isSafeInteger(economy.value.totalXp) || economy.value.totalXp < 0 ||
        !Number.isSafeInteger(economy.value.coinBalance) || economy.value.coinBalance < 0
      ) return failure('SHOP_PROFILE_INVALID');

      const catalog = await this.dependencies.catalog.list();
      if (!catalog.ok) {
        return failure(readErrorCode(catalog.error, 'SHOP_CATALOG_INVALID'));
      }
      if (!validCatalog(catalog.value, this.dependencies.approvedCatalog)) {
        return failure('SHOP_CATALOG_INVALID');
      }

      const ownedItems = await this.dependencies.ownedItems.listByProfile(MVP_PROFILE_ID);
      if (!ownedItems.ok) {
        return failure(readErrorCode(ownedItems.error, 'SHOP_OWNERSHIP_INVALID'));
      }
      const catalogIds = new Set(catalog.value.map(({ id }) => id));
      if (!validOwnedItems(ownedItems.value, catalogIds)) {
        return failure('SHOP_OWNERSHIP_INVALID');
      }

      let profile: HomeProfileProjection;
      try {
        profile = createHomeProfileProjection(economy.value);
      } catch {
        return failure('SHOP_PROFILE_INVALID');
      }
      return { ok: true, value: freezeProjection(profile, catalog.value, ownedItems.value) };
    } catch {
      return failure('SHOP_READ_FAILED');
    }
  }
}
