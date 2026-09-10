import {
  LoadShopProjectionUseCase,
  type CatalogRepository,
  type ClockPort,
  type EconomyConsistencyQuery,
  type IdPort,
  type OwnedItemRepository,
  type SessionCommandCoordinatorPort,
} from '@pixeldoro/application';

import {
  ShopAnalyticsRecorder,
  ShopController,
  type BootstrapProjection,
  type CriticalRecoveryPort,
} from '@/application';
import type { AnalyticsQueue } from '@/application/persistence';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

export interface CreateShopSliceDependencies {
  readonly analyticsQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  readonly clock: ClockPort;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly criticalRecovery: CriticalRecoveryPort;
  readonly economy: EconomyConsistencyQuery;
  readonly id: IdPort;
  readonly ownedItems: Pick<OwnedItemRepository, 'listByProfile'>;
  readonly readBootstrap: () => BootstrapProjection;
}

export const createShopSlice = (dependencies: CreateShopSliceDependencies) => {
  const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => Object.freeze({
    ...item,
    catalogVersion: INITIAL_SCHEMA_VERSION,
  }));
  Object.freeze(approvedCatalog);
  const useCase = new LoadShopProjectionUseCase({
    economy: dependencies.economy,
    catalog: dependencies.catalog,
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
  const shop = new ShopController({
    analytics,
    clock: dependencies.clock,
    criticalRecovery: dependencies.criticalRecovery,
    id: dependencies.id,
    loader,
  });
  return Object.freeze({
    shop,
    dispose: () => shop.dispose(),
  });
};
