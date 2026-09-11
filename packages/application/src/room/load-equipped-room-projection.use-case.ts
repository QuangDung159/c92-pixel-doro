import type { CatalogItemRecord, CatalogRepository } from '../persistence/catalog.repository';
import type { OwnedItemRecord, OwnedItemRepository } from '../persistence/owned-item.repository';
import type { PersistenceError } from '../persistence/persistence.error';
import type { ApplicationResult } from '../result/application-result';

const MVP_PROFILE_ID = 1;

export interface ApprovedRoomCatalogItem {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
  readonly catalogVersion: number;
}

export interface EquippedRoomItem {
  readonly itemId: string;
  readonly displayName: string;
  readonly equippedAt: number;
}

export interface EquippedRoomProjection {
  readonly items: readonly EquippedRoomItem[];
}

export type LoadEquippedRoomProjectionErrorCode =
  | 'ROOM_READ_FAILED'
  | 'ROOM_CATALOG_INVALID'
  | 'ROOM_OWNERSHIP_INVALID';

export interface LoadEquippedRoomProjectionError {
  readonly kind: 'load_equipped_room_projection_error';
  readonly code: LoadEquippedRoomProjectionErrorCode;
}

export interface LoadEquippedRoomProjectionDependencies {
  readonly approvedCatalog: readonly ApprovedRoomCatalogItem[];
  readonly catalog: Pick<CatalogRepository, 'list'>;
  readonly ownedItems: Pick<OwnedItemRepository, 'listByProfile'>;
}

const failure = (code: LoadEquippedRoomProjectionErrorCode): ApplicationResult<never, LoadEquippedRoomProjectionError> => ({
  ok: false,
  error: { kind: 'load_equipped_room_projection_error', code },
});

const validText = (value: string): boolean => value.trim().length > 0;
const validTime = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;

const validCatalog = (
  actual: readonly CatalogItemRecord[],
  approved: readonly ApprovedRoomCatalogItem[],
): boolean => approved.length > 0 && actual.length === approved.length &&
  unique(approved.map(({ id }) => id)) && unique(actual.map(({ id }) => id)) &&
  approved.every((expected, index) => {
    const item = actual[index];
    return item !== undefined && validText(expected.id) && validText(expected.displayName) &&
      item.id === expected.id && item.displayName === expected.displayName &&
      item.category === expected.category && item.priceCoins === expected.priceCoins &&
      item.catalogVersion === expected.catalogVersion && validTime(item.createdAt) &&
      validTime(item.updatedAt);
  });

const validOwnedItems = (
  owned: readonly OwnedItemRecord[],
  catalogIds: ReadonlySet<string>,
): boolean => {
  const seen = new Set<string>();
  return owned.every((item) => {
    const valid = item.profileId === MVP_PROFILE_ID && catalogIds.has(item.itemId) &&
      !seen.has(item.itemId) && validText(item.purchaseTransactionId) &&
      validTime(item.unlockedAt) && validTime(item.updatedAt) &&
      (item.isEquipped
        ? item.equippedAt !== null && validTime(item.equippedAt)
        : item.equippedAt === null);
    seen.add(item.itemId);
    return valid;
  });
};

const readCode = (
  error: PersistenceError,
  invalid: LoadEquippedRoomProjectionErrorCode,
): LoadEquippedRoomProjectionErrorCode =>
  error.code === 'PERSISTENCE_CORRUPT_DATA' ||
  error.code === 'PERSISTENCE_INVARIANT_MISMATCH' ? invalid : 'ROOM_READ_FAILED';

export class LoadEquippedRoomProjectionUseCase {
  constructor(private readonly dependencies: LoadEquippedRoomProjectionDependencies) {}

  async execute(): Promise<ApplicationResult<EquippedRoomProjection, LoadEquippedRoomProjectionError>> {
    try {
      const catalog = await this.dependencies.catalog.list();
      if (!catalog.ok) return failure(readCode(catalog.error, 'ROOM_CATALOG_INVALID'));
      if (!validCatalog(catalog.value, this.dependencies.approvedCatalog)) {
        return failure('ROOM_CATALOG_INVALID');
      }

      const owned = await this.dependencies.ownedItems.listByProfile(MVP_PROFILE_ID);
      if (!owned.ok) return failure(readCode(owned.error, 'ROOM_OWNERSHIP_INVALID'));
      const catalogIds = new Set(catalog.value.map(({ id }) => id));
      if (!validOwnedItems(owned.value, catalogIds)) return failure('ROOM_OWNERSHIP_INVALID');

      const ownership = new Map(owned.value.map((item) => [item.itemId, item]));
      const items = catalog.value.flatMap((item): EquippedRoomItem[] => {
        const record = ownership.get(item.id);
        if (record?.isEquipped !== true || record.equippedAt === null) return [];
        return [Object.freeze({
          itemId: item.id,
          displayName: item.displayName,
          equippedAt: record.equippedAt,
        })];
      });
      Object.freeze(items);
      return { ok: true, value: Object.freeze({ items }) };
    } catch {
      return failure('ROOM_READ_FAILED');
    }
  }
}
