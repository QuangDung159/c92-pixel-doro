import {
  PurchaseItemUseCase,
  ReconcileStandardFocusUseCase,
  SetItemEquippedUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type CatalogRepository,
  type EconomyConsistencyQuery,
  type OwnedItemRepository,
  type ProfileRepository,
  type PurchaseReceiptRepository,
  type RewardReceiptRepository,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

export type InventoryEquipReviewScenario =
  | 'inventory_empty'
  | 'inventory_mixed'
  | 'inventory_multi_equipped'
  | 'equip_read_failure_once';

const scenarios = new Set<InventoryEquipReviewScenario>([
  'inventory_empty',
  'inventory_mixed',
  'inventory_multi_equipped',
  'equip_read_failure_once',
]);

export const resolveInventoryEquipReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): InventoryEquipReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as InventoryEquipReviewScenario)
    ? value as InventoryEquipReviewScenario
    : undefined;

export const inventoryEquipReviewDatabaseName = (
  scenario: InventoryEquipReviewScenario,
): string => `pixeldoro-us-08-03-${scenario}.db`;

export interface InventoryEquipReviewFixtureDependencies {
  readonly catalog: CatalogRepository;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly economy: EconomyConsistencyQuery;
  readonly ownedItems: OwnedItemRepository;
  readonly profile: ProfileRepository;
  readonly purchases: PurchaseReceiptRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface InventoryEquipReviewFixture {
  readonly scenario: InventoryEquipReviewScenario;
  readonly databaseName: string;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  prepare(dependencies: InventoryEquipReviewFixtureDependencies): Promise<boolean>;
}

const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
  ...item,
  catalogVersion: INITIAL_SCHEMA_VERSION,
}));

const completeFocus = async (
  sequence: number,
  dependencies: InventoryEquipReviewFixtureDependencies,
): Promise<void> => {
  let now = 1_788_940_800_000 + sequence * 2_000_000;
  const id = { nextId: () => `us0803-focus-${sequence}` };
  const clock = { nowMs: () => now };
  const started = await new StartStandardFocusUseCase({
    calendar: { snapshot: () => ({
      ok: true as const,
      value: { localDate: '2026-09-11', utcOffsetMinutes: 420 },
    }) },
    clock,
    coordinator: dependencies.coordinator,
    id,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute({ durationMinutes: 25, mode: 'relax', workTag: 'coding' });
  if (!started.ok) throw new Error('inventory_fixture_focus_start_failed');
  now = started.value.session.endsAt;
  const completed = await new ReconcileStandardFocusUseCase({
    clock,
    coordinator: dependencies.coordinator,
    id: { nextId: () => `us0803-reward-${sequence}` },
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(started.value.session.id);
  if (!completed.ok || completed.value.outcome !== 'completed') {
    throw new Error('inventory_fixture_focus_completion_failed');
  }
};

const seedInventory = async (
  scenario: InventoryEquipReviewScenario,
  dependencies: InventoryEquipReviewFixtureDependencies,
): Promise<boolean> => {
  if (scenario === 'inventory_empty') return false;
  const targets = scenario === 'inventory_multi_equipped'
    ? ['desk-mug', 'tiny-plant', 'book-stack'] as const
    : ['desk-mug', 'tiny-plant'] as const;
  const desiredEquipped = scenario === 'inventory_multi_equipped'
    ? new Set(['desk-mug', 'tiny-plant'])
    : new Set(['tiny-plant']);
  const existing = await Promise.all(targets.map((itemId) =>
    dependencies.ownedItems.find(1, itemId)));
  if (existing.some((result) => !result.ok)) {
    throw new Error('inventory_fixture_owned_read_failed');
  }
  if (existing.every((result, index) => {
    if (!result.ok || result.value === null) return false;
    return result.value.isEquipped === desiredEquipped.has(targets[index]!);
  })) return false;
  if (existing.some((result) => result.ok && result.value !== null)) {
    throw new Error('inventory_fixture_partial_state_invalid');
  }
  const profile = await dependencies.profile.find();
  if (!profile.ok || profile.value === null ||
    profile.value.totalXp !== 0 || profile.value.coinBalance !== 0) {
    throw new Error('inventory_fixture_profile_state_invalid');
  }

  const focusCount = scenario === 'inventory_multi_equipped' ? 6 : 3;
  for (let index = 1; index <= focusCount; index += 1) {
    await completeFocus(index, dependencies);
  }
  for (let index = 0; index < targets.length; index += 1) {
    const itemId = targets[index]!;
    const purchased = await new PurchaseItemUseCase({
      approvedCatalog,
      catalog: dependencies.catalog,
      clock: { nowMs: () => 1_788_960_000_000 + index },
      coordinator: dependencies.coordinator,
      economy: dependencies.economy,
      id: { nextId: () => `us0803-purchase-${itemId}` },
      ownedItems: dependencies.ownedItems,
      profile: dependencies.profile,
      purchases: dependencies.purchases,
      transaction: dependencies.transaction,
    }).execute({ itemId });
    if (!purchased.ok || purchased.value.outcome !== 'fresh_commit') {
      throw new Error('inventory_fixture_purchase_failed');
    }
    if (desiredEquipped.has(itemId)) {
      const equipped = await new SetItemEquippedUseCase({
        approvedCatalog,
        catalog: dependencies.catalog,
        clock: { nowMs: () => 1_788_970_000_000 + index },
        coordinator: dependencies.coordinator,
        ownedItems: dependencies.ownedItems,
        purchases: dependencies.purchases,
        transaction: dependencies.transaction,
      }).execute({ itemId, isEquipped: true });
      if (!equipped.ok || equipped.value.outcome !== 'fresh_commit') {
        throw new Error('inventory_fixture_equip_failed');
      }
    }
  }
  return true;
};

export const createInventoryEquipReviewFixture = (
  scenario: InventoryEquipReviewScenario | undefined,
  delegate: CatalogRepository,
): InventoryEquipReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let listCount = 0;
  return {
    scenario,
    databaseName: inventoryEquipReviewDatabaseName(scenario),
    catalog: {
      list: async () => {
        listCount += 1;
        if (scenario === 'equip_read_failure_once' && listCount === 2) {
          return {
            ok: false,
            error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items', 'fixture'),
          };
        }
        return delegate.list();
      },
    },
    prepare: (dependencies) => seedInventory(scenario, dependencies),
  };
};
