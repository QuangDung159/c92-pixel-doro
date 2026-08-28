import type {
  CatalogRepository,
  OwnedItemRepository,
  ProfileRepository,
  PurchaseReceiptRepository,
  RewardReceiptRepository,
  SessionRepository,
} from '@pixeldoro/application';
import type {
  AnalyticsEventRepository,
  AppSettingsRepository,
  InstallationRepository,
  StoreReviewAttemptRepository,
} from '@/application';

import type { SQLiteDatabaseOwner } from './sqlite-database-owner';
import type { SQLiteTransaction } from './sqlite-transaction';
import {
  SQLiteAnalyticsEventRepository,
  SQLiteAppSettingsRepository,
  SQLiteCatalogRepository,
  SQLiteInstallationRepository,
  SQLiteOwnedItemRepository,
  SQLiteProfileRepository,
  SQLitePurchaseReceiptRepository,
  SQLiteRewardReceiptRepository,
  SQLiteSessionRepository,
  SQLiteStoreReviewAttemptRepository,
} from './repositories';

export interface MobilePersistenceGraph {
  readonly installation: InstallationRepository;
  readonly settings: AppSettingsRepository;
  readonly profile: ProfileRepository;
  readonly sessions: SessionRepository;
  readonly rewards: RewardReceiptRepository;
  readonly catalog: CatalogRepository;
  readonly purchases: PurchaseReceiptRepository;
  readonly ownedItems: OwnedItemRepository;
  readonly storeReviewAttempts: StoreReviewAttemptRepository;
  readonly analyticsEvents: AnalyticsEventRepository;
}

export const createSQLitePersistenceGraph = (
  owner: SQLiteDatabaseOwner,
  transaction: SQLiteTransaction,
): MobilePersistenceGraph => Object.freeze({
  installation: new SQLiteInstallationRepository(owner),
  settings: new SQLiteAppSettingsRepository(owner),
  profile: new SQLiteProfileRepository(owner, transaction),
  sessions: new SQLiteSessionRepository(owner, transaction),
  rewards: new SQLiteRewardReceiptRepository(owner, transaction),
  catalog: new SQLiteCatalogRepository(owner, transaction),
  purchases: new SQLitePurchaseReceiptRepository(owner, transaction),
  ownedItems: new SQLiteOwnedItemRepository(owner, transaction),
  storeReviewAttempts: new SQLiteStoreReviewAttemptRepository(owner),
  analyticsEvents: new SQLiteAnalyticsEventRepository(owner),
});

export const PERSISTENCE_ENTITY_OWNERS = Object.freeze([
  'app_installation',
  'app_settings',
  'pet_profiles',
  'sessions',
  'reward_transactions',
  'catalog_items',
  'purchase_transactions',
  'owned_items',
  'store_review_attempts',
  'analytics_events',
] as const);
