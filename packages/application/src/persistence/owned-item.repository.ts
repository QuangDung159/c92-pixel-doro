import type { TransactionScope } from '../ports/transaction.port';
import type {
  ConditionalWriteOutcome,
  PersistenceResult,
} from './persistence.error';

export interface OwnedItemRecord {
  readonly profileId: number;
  readonly itemId: string;
  readonly purchaseTransactionId: string;
  readonly unlockedAt: number;
  readonly isEquipped: boolean;
  readonly equippedAt: number | null;
  readonly updatedAt: number;
}

export interface SetOwnedItemEquippedInput {
  readonly profileId: number;
  readonly itemId: string;
  readonly isEquipped: boolean;
  readonly equippedAt: number | null;
  readonly updatedAt: number;
}

export interface OwnedItemRepository {
  find(
    profileId: number,
    itemId: string,
  ): Promise<PersistenceResult<OwnedItemRecord | null>>;
  listByProfile(
    profileId: number,
  ): Promise<PersistenceResult<readonly OwnedItemRecord[]>>;
  findInTransaction(
    scope: TransactionScope,
    profileId: number,
    itemId: string,
  ): Promise<PersistenceResult<OwnedItemRecord | null>>;
  insertInTransaction(
    scope: TransactionScope,
    record: OwnedItemRecord,
  ): Promise<PersistenceResult<void>>;
  setEquippedInTransaction(
    scope: TransactionScope,
    input: SetOwnedItemEquippedInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
}
