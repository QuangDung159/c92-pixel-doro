import type { TransactionScope } from '../ports/transaction.port';
import type { PersistenceResult } from './persistence.error';

export interface CatalogItemRecord {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
  readonly catalogVersion: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CatalogRepository {
  findById(id: string): Promise<PersistenceResult<CatalogItemRecord | null>>;
  list(): Promise<PersistenceResult<readonly CatalogItemRecord[]>>;
  findByIdInTransaction(
    scope: TransactionScope,
    id: string,
  ): Promise<PersistenceResult<CatalogItemRecord | null>>;
}
