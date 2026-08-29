import type {
  CatalogRepository,
  ContributionQuery,
  EconomyConsistencyQuery,
  LongBreakCadenceQuery,
  OwnedItemRepository,
  ProfileRepository,
  PurchaseReceiptRepository,
  RewardReceiptRepository,
  SessionRepository,
  StandardFocusHistoryQuery,
} from '@pixeldoro/application';
import type {
  AnalyticsQueue,
  AnalyticsEventRepository,
  AppSettingsRepository,
  InstallationRepository,
  StoreReviewAttemptRepository,
  StoreReviewFactsQuery,
} from '@/application';
import { BoundedAnalyticsQueue } from '@/application';

import type { SQLiteDatabaseOwner } from './sqlite-database-owner';
import type { SQLiteTransaction } from './sqlite-transaction';
import {
  SQLiteContributionQuery,
  SQLiteEconomyConsistencyQuery,
  SQLiteLongBreakCadenceQuery,
  SQLiteStandardFocusHistoryQuery,
  SQLiteStoreReviewFactsQuery,
} from './queries';
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
  readonly analyticsEvents: Pick<AnalyticsEventRepository, 'findById'>;
  readonly standardFocusHistory: StandardFocusHistoryQuery;
  readonly contribution: ContributionQuery;
  readonly longBreakCadence: LongBreakCadenceQuery;
  readonly economyConsistency: EconomyConsistencyQuery;
  readonly storeReviewFacts: StoreReviewFactsQuery;
  readonly analyticsQueue: AnalyticsQueue;
}

export const createSQLitePersistenceGraph = (
  owner: SQLiteDatabaseOwner,
  transaction: SQLiteTransaction,
): MobilePersistenceGraph => {
  const analyticsEvents = new SQLiteAnalyticsEventRepository(owner, transaction);
  const analyticsEventReader = Object.freeze({
    findById: (eventId: string) => analyticsEvents.findById(eventId),
  });
  return Object.freeze({
    installation: new SQLiteInstallationRepository(owner),
    settings: new SQLiteAppSettingsRepository(owner),
    profile: new SQLiteProfileRepository(owner, transaction),
    sessions: new SQLiteSessionRepository(owner, transaction),
    rewards: new SQLiteRewardReceiptRepository(owner, transaction),
    catalog: new SQLiteCatalogRepository(owner, transaction),
    purchases: new SQLitePurchaseReceiptRepository(owner, transaction),
    ownedItems: new SQLiteOwnedItemRepository(owner, transaction),
    storeReviewAttempts: new SQLiteStoreReviewAttemptRepository(owner),
    analyticsEvents: analyticsEventReader,
    standardFocusHistory: new SQLiteStandardFocusHistoryQuery(owner),
    contribution: new SQLiteContributionQuery(owner),
    longBreakCadence: new SQLiteLongBreakCadenceQuery(owner),
    economyConsistency: new SQLiteEconomyConsistencyQuery(transaction),
    storeReviewFacts: new SQLiteStoreReviewFactsQuery(owner),
    analyticsQueue: new BoundedAnalyticsQueue(transaction, analyticsEvents),
  });
};

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
