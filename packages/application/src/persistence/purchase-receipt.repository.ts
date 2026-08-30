import type { TransactionScope } from '../ports/transaction.port';
import type { PersistenceResult } from './persistence.error';

export interface PurchaseReceiptRecord {
  readonly id: string;
  readonly profileId: number;
  readonly itemId: string;
  readonly pricePaidCoins: number;
  readonly coinDelta: number;
  readonly reason: 'item_purchase';
  readonly createdAt: number;
}

export interface PurchaseReceiptRepository {
  findById(
    id: string,
  ): Promise<PersistenceResult<PurchaseReceiptRecord | null>>;
  findByProfileAndItem(
    profileId: number,
    itemId: string,
  ): Promise<PersistenceResult<PurchaseReceiptRecord | null>>;
  insertInTransaction(
    scope: TransactionScope,
    record: PurchaseReceiptRecord,
  ): Promise<PersistenceResult<void>>;
}
