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

import type { AnalyticsQueue } from '@/application';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_VERSION,
} from '@/infrastructure/database/migrations/schema-manifest';

export type Epic08ExitReviewScenario =
  | 'epic_08_fresh_reward_to_room'
  | 'epic_08_relaunch_committed'
  | 'epic_08_provider_failure'
  | 'epic_08_accessibility_matrix';

const scenarios = new Set<Epic08ExitReviewScenario>([
  'epic_08_fresh_reward_to_room',
  'epic_08_relaunch_committed',
  'epic_08_provider_failure',
  'epic_08_accessibility_matrix',
]);

export const resolveEpic08ExitReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): Epic08ExitReviewScenario | undefined =>
  enabled && value !== undefined && scenarios.has(value as Epic08ExitReviewScenario)
    ? value as Epic08ExitReviewScenario
    : undefined;

export const epic08ExitReviewDatabaseName = (
  scenario: Epic08ExitReviewScenario,
): string => `pixeldoro-us-08-05-${scenario}.db`;

export interface Epic08ExitReviewFixtureDependencies {
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

export interface Epic08ExitReviewFixture {
  readonly scenario: Epic08ExitReviewScenario;
  readonly databaseName: string;
  readonly analyticsQueue: AnalyticsQueue;
  prepare(dependencies: Epic08ExitReviewFixtureDependencies): Promise<boolean>;
}

const approvedCatalog = INITIAL_CATALOG_SEED.map((item) => ({
  ...item,
  catalogVersion: INITIAL_SCHEMA_VERSION,
}));

const completeFocus = async (
  sequence: number,
  dependencies: Epic08ExitReviewFixtureDependencies,
): Promise<void> => {
  let now = 1_788_940_800_000 + sequence * 2_000_000;
  const started = await new StartStandardFocusUseCase({
    calendar: { snapshot: () => ({
      ok: true as const,
      value: { localDate: '2026-09-11', utcOffsetMinutes: 420 },
    }) },
    clock: { nowMs: () => now },
    coordinator: dependencies.coordinator,
    id: { nextId: () => `us0805-focus-${sequence}` },
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute({ durationMinutes: 25, mode: 'relax', workTag: 'coding' });
  if (!started.ok) throw new Error('epic_08_exit_focus_start_failed');
  now = started.value.session.endsAt;
  const completed = await new ReconcileStandardFocusUseCase({
    clock: { nowMs: () => now },
    coordinator: dependencies.coordinator,
    id: { nextId: () => `us0805-reward-${sequence}` },
    profile: dependencies.profile,
    rewards: dependencies.rewards,
    sessions: dependencies.sessions,
    transaction: dependencies.transaction,
  }).execute(started.value.session.id);
  if (!completed.ok || completed.value.outcome !== 'completed') {
    throw new Error('epic_08_exit_focus_completion_failed');
  }
};

const prepareCommittedState = async (
  scenario: Epic08ExitReviewScenario,
  dependencies: Epic08ExitReviewFixtureDependencies,
): Promise<boolean> => {
  if (scenario === 'epic_08_fresh_reward_to_room' ||
    scenario === 'epic_08_provider_failure') return false;
  const targets = scenario === 'epic_08_accessibility_matrix'
    ? ['desk-mug', 'tiny-plant'] as const
    : ['desk-mug'] as const;
  const expectedEquipped = new Set(
    scenario === 'epic_08_accessibility_matrix' ? ['tiny-plant'] : ['desk-mug'],
  );
  const existing = await Promise.all(targets.map((itemId) =>
    dependencies.ownedItems.find(1, itemId)));
  if (existing.some((result) => !result.ok)) {
    throw new Error('epic_08_exit_owned_read_failed');
  }
  if (existing.every((result, index) => result.ok && result.value !== null &&
    result.value.isEquipped === expectedEquipped.has(targets[index]!))) return false;
  if (existing.some((result) => result.ok && result.value !== null)) {
    throw new Error('epic_08_exit_partial_state_invalid');
  }
  const profile = await dependencies.profile.find();
  if (!profile.ok || profile.value === null || profile.value.totalXp !== 0 ||
    profile.value.coinBalance !== 0) {
    throw new Error('epic_08_exit_profile_state_invalid');
  }

  const focusCount = scenario === 'epic_08_accessibility_matrix' ? 3 : 1;
  for (let sequence = 1; sequence <= focusCount; sequence += 1) {
    await completeFocus(sequence, dependencies);
  }
  for (const [index, itemId] of targets.entries()) {
    const purchased = await new PurchaseItemUseCase({
      approvedCatalog,
      catalog: dependencies.catalog,
      clock: { nowMs: () => 1_788_960_000_000 + index },
      coordinator: dependencies.coordinator,
      economy: dependencies.economy,
      id: { nextId: () => `us0805-purchase-${itemId}` },
      ownedItems: dependencies.ownedItems,
      profile: dependencies.profile,
      purchases: dependencies.purchases,
      transaction: dependencies.transaction,
    }).execute({ itemId });
    if (!purchased.ok || purchased.value.outcome !== 'fresh_commit') {
      throw new Error('epic_08_exit_purchase_failed');
    }
    if (expectedEquipped.has(itemId)) {
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
        throw new Error('epic_08_exit_equip_failed');
      }
    }
  }
  return true;
};

export const createEpic08ExitReviewFixture = (
  scenario: Epic08ExitReviewScenario | undefined,
  analyticsQueue: AnalyticsQueue,
): Epic08ExitReviewFixture | undefined => {
  if (scenario === undefined) return undefined;
  const failAnalytics = scenario === 'epic_08_provider_failure';
  return {
    scenario,
    databaseName: epic08ExitReviewDatabaseName(scenario),
    analyticsQueue: {
      enqueueBounded: (event, nowMs) => failAnalytics
        ? Promise.resolve({
            ok: false,
            error: persistenceError(
              'PERSISTENCE_WRITE_FAILED',
              'analytics_events',
              'epic_08_provider_failure',
            ),
          })
        : analyticsQueue.enqueueBounded(event, nowMs),
      listDue: (nowMs, limit) => analyticsQueue.listDue(nowMs, limit),
      markRetry: (input) => analyticsQueue.markRetry(input),
      deleteDelivered: (eventIds) => analyticsQueue.deleteDelivered(eventIds),
      clear: () => analyticsQueue.clear(),
    },
    prepare: (dependencies) => prepareCommittedState(scenario, dependencies),
  };
};
