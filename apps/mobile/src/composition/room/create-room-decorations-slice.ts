import {
  LoadEquippedRoomProjectionUseCase,
  type EquippedRoomProjection,
  type CatalogRepository,
  type OwnedItemRepository,
  type SessionCommandCoordinatorPort,
} from '@pixeldoro/application';

import { RoomDecorationsController } from '@/application';
import { INITIAL_CATALOG_SEED, INITIAL_SCHEMA_VERSION } from '@/infrastructure/database/migrations/schema-manifest';

export interface CreateRoomDecorationsSliceDependencies {
  readonly catalog: Pick<CatalogRepository, 'list'>;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly ownedItems: Pick<OwnedItemRepository, 'listByProfile'>;
  readonly reviewProjection?: EquippedRoomProjection;
}

export const createRoomDecorationsSlice = (dependencies: CreateRoomDecorationsSliceDependencies) => {
  const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => Object.freeze({
    ...item,
    catalogVersion: INITIAL_SCHEMA_VERSION,
  }));
  Object.freeze(approvedCatalog);
  const useCase = new LoadEquippedRoomProjectionUseCase({
    approvedCatalog,
    catalog: dependencies.catalog,
    ownedItems: dependencies.ownedItems,
  });
  const controller = new RoomDecorationsController({
    execute: () => dependencies.coordinator.run(() => dependencies.reviewProjection === undefined
      ? useCase.execute()
      : Promise.resolve({ ok: true as const, value: dependencies.reviewProjection })),
  });
  return Object.freeze({ controller, dispose: () => controller.dispose() });
};
