import {
  PurchaseItemUseCase,
  ReconcileStandardFocusUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type CatalogRepository,
  type ClockPort,
  type EconomyConsistencyQuery,
  type IdPort,
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

export type ShopPurchaseReviewScenario =
  | 'purchase_exact_balance'
  | 'purchase_insufficient'
  | 'purchase_owned'
  | 'purchase_read_failure_once';

const scenarios = new Set<ShopPurchaseReviewScenario>([
  'purchase_exact_balance',
  'purchase_insufficient',
  'purchase_owned',
  'purchase_read_failure_once',
]);

export const resolveShopPurchaseReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): ShopPurchaseReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as ShopPurchaseReviewScenario)
    ? value as ShopPurchaseReviewScenario
    : undefined;

export const shopPurchaseReviewDatabaseName = (
  scenario: ShopPurchaseReviewScenario,
): string => `pixeldoro-us-08-02-${scenario}.db`;

export interface ShopPurchaseReviewFixtureDependencies {
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

export interface ShopPurchaseReviewFixture {
  readonly scenario: ShopPurchaseReviewScenario;
  readonly databaseName: string;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  prepare(dependencies: ShopPurchaseReviewFixtureDependencies): Promise<boolean>;
}

const seedExactBalance = async (
  scenario: ShopPurchaseReviewScenario,
  dependencies: ShopPurchaseReviewFixtureDependencies,
): Promise<boolean> => {
  if (scenario === 'purchase_insufficient') return false;
  const profile = await dependencies.profile.find();
  if (!profile.ok || profile.value === null) throw new Error('purchase_fixture_profile_read_failed');
  if (profile.value.totalXp === 25 && profile.value.coinBalance === 5) return false;
  if (profile.value.totalXp === 25 && profile.value.coinBalance === 0) {
    const ownership = await dependencies.ownedItems.find(1, 'desk-mug');
    if (ownership.ok && ownership.value !== null) return false;
    throw new Error('purchase_fixture_spent_state_invalid');
  }
  if (profile.value.totalXp !== 0 || profile.value.coinBalance !== 0) {
    throw new Error('purchase_fixture_profile_state_invalid');
  }

  let now = 1_788_940_800_000;
  let sequence = 0;
  const clock: ClockPort = { nowMs: () => now };
  const id: IdPort = { nextId: () => `us0802-${scenario}-${++sequence}` };
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
  if (!started.ok) throw new Error('purchase_fixture_focus_start_failed');
  now = started.value.session.endsAt;
  const completed = await new ReconcileStandardFocusUseCase({
    clock,
    coordinator: dependencies.coordinator,
    id,
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(started.value.session.id);
  if (!completed.ok || completed.value.outcome !== 'completed') {
    throw new Error('purchase_fixture_focus_completion_failed');
  }
  return true;
};

const seedOwned = async (
  scenario: ShopPurchaseReviewScenario,
  dependencies: ShopPurchaseReviewFixtureDependencies,
): Promise<boolean> => {
  if (scenario !== 'purchase_owned') return false;
  const existing = await dependencies.ownedItems.find(1, 'desk-mug');
  if (!existing.ok) throw new Error('purchase_fixture_owned_read_failed');
  if (existing.value !== null) return false;
  const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
    ...item,
    catalogVersion: INITIAL_SCHEMA_VERSION,
  }));
  const purchased = await new PurchaseItemUseCase({
    approvedCatalog,
    catalog: dependencies.catalog,
    clock: { nowMs: () => 1_788_942_300_001 },
    coordinator: dependencies.coordinator,
    economy: dependencies.economy,
    id: { nextId: () => 'us0802-owned-receipt' },
    ownedItems: dependencies.ownedItems,
    profile: dependencies.profile,
    purchases: dependencies.purchases,
    transaction: dependencies.transaction,
  }).execute({ itemId: 'desk-mug' });
  if (!purchased.ok || purchased.value.outcome === 'insufficient_funds') {
    throw new Error('purchase_fixture_purchase_failed');
  }
  return purchased.value.outcome !== 'already_owned';
};

export const createShopPurchaseReviewFixture = (
  scenario: ShopPurchaseReviewScenario | undefined,
  delegate: CatalogRepository,
): ShopPurchaseReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let listCount = 0;
  const catalog: Pick<CatalogRepository, 'list'> = {
    list: async () => {
      listCount += 1;
      if (scenario === 'purchase_read_failure_once' && listCount === 2) {
        return {
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items', 'fixture'),
        };
      }
      return delegate.list();
    },
  };
  return {
    scenario,
    databaseName: shopPurchaseReviewDatabaseName(scenario),
    catalog,
    prepare: async (dependencies) => {
      const progressionChanged = await seedExactBalance(scenario, dependencies);
      const ownershipChanged = await seedOwned(scenario, dependencies);
      return progressionChanged || ownershipChanged;
    },
  };
};
