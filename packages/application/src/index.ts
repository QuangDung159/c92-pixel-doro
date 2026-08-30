export {
  CreateFoundationSnapshotUseCase,
  type CreateFoundationSnapshotDependencies,
  type FoundationSnapshot,
} from './foundation/create-foundation-snapshot.use-case';
export {
  createHomeProfileProjection,
  type HomeProfileProjection,
} from './home/create-home-profile.projection';
export {
  loadPetCompanionProjection,
  type PetCompanionProjection,
  type PetCompanionSessionReader,
} from './pet/load-pet-companion.projection';
export { PetCompanionController } from './pet/pet-companion.controller';
export {
  PetTerminalFeedbackController,
  type PetFeedbackScheduler,
  type PetTerminalFeedbackControllerDependencies,
  type PetTerminalFeedbackProjection,
  type PetTerminalFeedbackRequestResult,
} from './pet/pet-terminal-feedback.controller';
export type { ClockPort } from './ports/clock.port';
export type { IdPort } from './ports/id.port';
export type {
  CatalogItemRecord,
  CatalogRepository,
} from './persistence/catalog.repository';
export type {
  CompletedLongBreakFact,
  ContributionDayFact,
  ContributionQuery,
  ContributionRangeInput,
  EconomyConsistencyQuery,
  EconomyConsistencySnapshot,
  LongBreakCadenceFacts,
  LongBreakCadenceQuery,
  StandardFocusHistoryCursor,
  StandardFocusHistoryEntry,
  StandardFocusHistoryInput,
  StandardFocusHistoryPage,
  StandardFocusHistoryQuery,
} from './persistence/derived-query';
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
