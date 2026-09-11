import {
  ReconcileStandardFocusUseCase,
  StartStandardFocusUseCase,
  persistenceError,
  type CatalogRepository,
  type ClockPort,
  type IdPort,
  type OwnedItemRepository,
  type ProfileRepository,
  type PurchaseReceiptRepository,
  type RewardReceiptRepository,
  type SessionCommandCoordinatorPort,
  type SessionRepository,
  type TransactionPort,
} from '@pixeldoro/application';

export type ShopReviewScenario =
  | 'shop_fresh_zero'
  | 'shop_progress_45'
  | 'shop_progress_50'
  | 'shop_owned_mixed'
  | 'shop_read_failure_once'
  | 'shop_catalog_corrupt';

const scenarios = new Set<ShopReviewScenario>([
  'shop_fresh_zero',
  'shop_progress_45',
  'shop_progress_50',
  'shop_owned_mixed',
  'shop_read_failure_once',
  'shop_catalog_corrupt',
]);

export const resolveShopReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): ShopReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as ShopReviewScenario)
    ? value as ShopReviewScenario
    : undefined;

export const shopReviewDatabaseName = (
  scenario: ShopReviewScenario,
): string => `pixeldoro-us-08-01-${scenario}.db`;

export interface ShopReviewFixtureDependencies {
  readonly catalog: CatalogRepository;
  readonly coordinator: SessionCommandCoordinatorPort;
  readonly ownedItems: OwnedItemRepository;
  readonly profile: ProfileRepository;
  readonly purchases: PurchaseReceiptRepository;
  readonly rewards: RewardReceiptRepository;
  readonly sessions: SessionRepository;
  readonly transaction: TransactionPort;
}

export interface ShopReviewFixture {
  readonly scenario: ShopReviewScenario;
  readonly databaseName: string;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  prepare(dependencies: ShopReviewFixtureDependencies): Promise<boolean>;
}

const targetFor = (scenario: ShopReviewScenario): { readonly xp: number; readonly duration: number } | null => {
  if (scenario === 'shop_progress_45') return { xp: 45, duration: 15 };
  if (scenario === 'shop_progress_50') return { xp: 50, duration: 25 };
  if (scenario === 'shop_owned_mixed') return { xp: 75, duration: 25 };
  return null;
};

const seedProgress = async (
  scenario: ShopReviewScenario,
  dependencies: ShopReviewFixtureDependencies,
): Promise<boolean> => {
  const target = targetFor(scenario);
  if (target === null) return false;
  const current = await dependencies.profile.find();
  if (!current.ok || current.value === null) throw new Error('shop_fixture_profile_read_failed');
  if (current.value.totalXp === target.xp) return false;
  if (
    current.value.totalXp > target.xp ||
    current.value.totalXp % target.duration !== 0 ||
    (target.xp - current.value.totalXp) % target.duration !== 0
  ) throw new Error('shop_fixture_profile_state_invalid');

  let now = 1_788_854_400_000 + current.value.totalXp * 60_000;
  let sequence = (current.value.totalXp / target.duration) * 2;
  const clock: ClockPort = { nowMs: () => now };
  const id: IdPort = { nextId: () => `us0801-${scenario}-${++sequence}` };
  const calendar = {
    snapshot: () => ({
      ok: true as const,
      value: { localDate: '2026-09-10', utcOffsetMinutes: 420 },
    }),
  };
  let totalXp = current.value.totalXp;
  while (totalXp < target.xp) {
    const started = await new StartStandardFocusUseCase({
      calendar,
      clock,
      coordinator: dependencies.coordinator,
      id,
      sessions: dependencies.sessions,
      transaction: dependencies.transaction,
    }).execute({ durationMinutes: target.duration, mode: 'relax', workTag: 'coding' });
    if (!started.ok) throw new Error('shop_fixture_focus_start_failed');
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
      throw new Error('shop_fixture_focus_completion_failed');
    }
    totalXp += target.duration;
    now += 1_000;
  }
  return true;
};

const seedOwned = async (
  scenario: ShopReviewScenario,
  dependencies: ShopReviewFixtureDependencies,
): Promise<boolean> => {
  if (scenario !== 'shop_owned_mixed') return false;
  const existing = await dependencies.ownedItems.listByProfile(1);
  if (!existing.ok) throw new Error('shop_fixture_owned_read_failed');
  if (existing.value.length === 2) return false;
  if (existing.value.length !== 0) throw new Error('shop_fixture_owned_state_invalid');

  const purchasedAt = 1_788_861_600_000;
  const items = [
    { itemId: 'desk-mug', receiptId: 'us0801-purchase-desk-mug', equipped: false },
    { itemId: 'tiny-plant', receiptId: 'us0801-purchase-tiny-plant', equipped: true },
  ] as const;
  const result = await dependencies.transaction.execute(async (scope) => {
    for (const [index, item] of items.entries()) {
      const catalog = await dependencies.catalog.findByIdInTransaction(scope, item.itemId);
      if (!catalog.ok || catalog.value === null) {
        return { ok: false as const, error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items') };
      }
      const timestamp = purchasedAt + index;
      const debit = await dependencies.profile.debitCatalogItemInTransaction(scope, {
        profileId: 1,
        itemId: item.itemId,
        updatedAt: timestamp,
      });
      if (!debit.ok || debit.value !== 'updated') {
        return debit.ok
          ? { ok: false as const, error: persistenceError('PERSISTENCE_WRITE_FAILED', 'pet_profiles') }
          : debit;
      }
      const receipt = await dependencies.purchases.insertInTransaction(scope, {
        id: item.receiptId,
        profileId: 1,
        itemId: item.itemId,
        pricePaidCoins: catalog.value.priceCoins,
        coinDelta: -catalog.value.priceCoins,
        reason: 'item_purchase',
        createdAt: timestamp,
      });
      if (!receipt.ok) return receipt;
      const owned = await dependencies.ownedItems.insertInTransaction(scope, {
        profileId: 1,
        itemId: item.itemId,
        purchaseTransactionId: item.receiptId,
        unlockedAt: timestamp,
        isEquipped: item.equipped,
        equippedAt: item.equipped ? timestamp : null,
        updatedAt: timestamp,
      });
      if (!owned.ok) return owned;
    }
    return { ok: true as const, value: undefined };
  });
  if (!result.ok) throw new Error('shop_fixture_purchase_seed_failed');
  return true;
};

export const createShopReviewFixture = (
  scenario: ShopReviewScenario | undefined,
  delegate: CatalogRepository,
): ShopReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  let failRead = scenario === 'shop_read_failure_once';
  const catalog: Pick<CatalogRepository, 'list'> = {
    list: async () => {
      if (failRead) {
        failRead = false;
        return {
          ok: false,
          error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items', 'fixture'),
        };
      }
      const result = await delegate.list();
      if (!result.ok || scenario !== 'shop_catalog_corrupt') return result;
      return { ok: true, value: result.value.slice(0, -1) };
    },
  };
  return {
    scenario,
    databaseName: shopReviewDatabaseName(scenario),
    catalog,
    prepare: async (dependencies) => {
      const progressionChanged = await seedProgress(scenario, dependencies);
      const ownershipChanged = await seedOwned(scenario, dependencies);
      return progressionChanged || ownershipChanged;
    },
  };
};
