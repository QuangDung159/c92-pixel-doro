import type { TransactionScope } from '../ports/transaction.port';
import type {
  ConditionalWriteOutcome,
  PersistenceResult,
} from './persistence.error';

export interface ProfileRecord {
  readonly id: number;
  readonly totalXp: number;
  readonly coinBalance: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ApplyProgressionInput {
  readonly profileId: number;
  readonly xpDelta: number;
  readonly coinDelta: number;
  readonly updatedAt: number;
}

export interface DebitCatalogItemInput {
  readonly profileId: number;
  readonly itemId: string;
  readonly updatedAt: number;
}

export interface ProfileRepository {
  find(): Promise<PersistenceResult<ProfileRecord | null>>;
  findInTransaction(
    scope: TransactionScope,
  ): Promise<PersistenceResult<ProfileRecord | null>>;
  applyProgressionInTransaction(
    scope: TransactionScope,
    input: ApplyProgressionInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
  debitCatalogItemInTransaction(
    scope: TransactionScope,
    input: DebitCatalogItemInput,
  ): Promise<PersistenceResult<ConditionalWriteOutcome>>;
}
