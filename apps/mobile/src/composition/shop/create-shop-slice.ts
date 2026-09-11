import {
  LoadShopProjectionUseCase,
  PurchaseItemUseCase,
  type CatalogRepository,
  type ClockPort,
  type EconomyConsistencyQuery,
  type IdPort,
  type OwnedItemRepository,
  type ProfileRepository,
  type PurchaseReceiptRepository,
  type SessionCommandCoordinatorPort,
  type TransactionPort,
} from '@pixeldoro/application';

import {
  ItemUnlockedAnalyticsRecorder,
  ShopAnalyticsRecorder,
  ShopController,
  type BootstrapProjection,
  type CommandReadinessPort,
  type CriticalRecoveryPort,
} from '@/application';
import type { AnalyticsQueue } from '@/application/persistence';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

export interface CreateShopSliceDependencies {
  readonly analyticsQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly catalog: CatalogRepository;
  readonly catalogList?: Pick<CatalogRepository, 'list'>;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly economy: EconomyConsistencyQuery;
  readonly id: IdPort;
  readonly ownedItems: OwnedItemRepository;
  readonly profile: Pick<ProfileRepository, 'findInTransaction' | 'debitCatalogItemInTransaction'>;
  readonly purchases: Pick<
    PurchaseReceiptRepository,
    'findByProfileAndItem' | 'findByProfileAndItemInTransaction' | 'insertInTransaction'
  >;
  readonly readiness: CommandReadinessPort;
  readonly readBootstrap: () => BootstrapProjection;
  readonly transaction: TransactionPort;
}

export const createShopSlice = (dependencies: CreateShopSliceDependencies) => {
  const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => Object.freeze({
    ...item,
    catalogVersion: INITIAL_SCHEMA_VERSION,
  }));
  Object.freeze(approvedCatalog);
  const useCase = new LoadShopProjectionUseCase({
    economy: dependencies.economy,
    catalog: dependencies.catalogList ?? dependencies.catalog,
    ownedItems: dependencies.ownedItems,
    approvedCatalog,
  });
  const loader = {
    execute: () => dependencies.coordinator.run(() => useCase.execute()),
  };
  const analytics = new ShopAnalyticsRecorder({
    isCaptureEnabled: () => {
      const projection = dependencies.readBootstrap();
      return projection.status === 'ready' &&
        projection.snapshot.settings.analyticsEnabled;
    },
    queue: dependencies.analyticsQueue,
  });
  const itemUnlockedAnalytics = new ItemUnlockedAnalyticsRecorder({
    isCaptureEnabled: () => {
      const projection = dependencies.readBootstrap();
      return projection.status === 'ready' &&
        projection.snapshot.settings.analyticsEnabled;
    },
    queue: dependencies.analyticsQueue,
  });
  const purchaseUseCase = new PurchaseItemUseCase({
    approvedCatalog,
    catalog: dependencies.catalog,
    clock: dependencies.clock,
    coordinator: dependencies.coordinator,
    economy: dependencies.economy,
    id: dependencies.id,
    ownedItems: dependencies.ownedItems,
    profile: dependencies.profile,
    purchases: dependencies.purchases,
    transaction: dependencies.transaction,
  });
  const purchaseItem = {
    execute: (input: { readonly itemId: string }) => {
      const gated = dependencies.readiness.run(() => purchaseUseCase.execute(input));
      return gated.ok
        ? gated.value
        : Promise.resolve({
          ok: false as const,
          error: {
            kind: 'purchase_item_error' as const,
            code: 'PURCHASE_TRANSACTION_FAILED' as const,
          },
        });
    },
  };
  const shop = new ShopController({
    analytics,
    clock: dependencies.clock,
    criticalRecovery: dependencies.criticalRecovery,
    id: dependencies.id,
    itemUnlockedAnalytics,
    loader,
    purchaseItem,
  });
  return Object.freeze({
    shop,
    dispose: () => shop.dispose(),
  });
};
