export {
  CreateFoundationSnapshotUseCase,
  type CreateFoundationSnapshotDependencies,
  type FoundationSnapshot,
} from './foundation/create-foundation-snapshot.use-case';
export type { ClockPort } from './ports/clock.port';
export type { IdPort } from './ports/id.port';
export type {
  CatalogItemRecord,
  CatalogRepository,
} from './persistence/catalog.repository';
export type {
  OwnedItemRecord,
  OwnedItemRepository,
  SetOwnedItemEquippedInput,
} from './persistence/owned-item.repository';
export {
  persistenceError,
  type ConditionalWriteOutcome,
  type PersistenceError,
  type PersistenceErrorCode,
  type PersistenceResult,
} from './persistence/persistence.error';
export type {
  ApplyProgressionInput,
  DebitCatalogItemInput,
  ProfileRecord,
  ProfileRepository,
} from './persistence/profile.repository';
export type {
  PurchaseReceiptRecord,
  PurchaseReceiptRepository,
} from './persistence/purchase-receipt.repository';
export type {
  RewardReason,
  RewardReceiptRecord,
  RewardReceiptRepository,
} from './persistence/reward-receipt.repository';
export type {
  FocusMode,
  FocusVariant,
  RecordSessionBackgroundInput,
  RunningSessionRecord,
  SessionRecord,
  SessionRepository,
  SessionStatus,
  SessionType,
  TransitionSessionInput,
  WorkTag,
} from './persistence/session.repository';
export {
  transactionTechnicalError,
  type TransactionTechnicalError,
  type TransactionTechnicalErrorCode,
} from './ports/transaction.error';
export type {
  TransactionPort,
  TransactionScope,
} from './ports/transaction.port';
export type {
  ApplicationResult,
  ApplicationWarning,
} from './result/application-result';
