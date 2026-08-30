import {
  persistenceError,
  type PersistenceResult,
  type TransactionScope,
} from '@pixeldoro/application';
import type {
  ConfirmedResetPersistencePort,
  ConfirmedResetPersistenceSummary,
  ConfirmedResetSeed,
} from '@/application';

import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_TABLES,
  INITIAL_SCHEMA_VERSION,
} from '../migrations/schema-manifest';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import { withTransactionExecutor } from '../repositories/sqlite-repository-support';

interface NameRow {
  readonly name: string;
}

interface CatalogRow {
  readonly id: string;
  readonly display_name: string;
  readonly category: string;
  readonly price_coins: number;
  readonly catalog_version: number;
}

interface MigrationRow {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly applied_at: number;
}

interface ResetPostconditionRow {
  readonly installation_count: number;
  readonly settings_count: number;
  readonly profile_count: number;
  readonly session_count: number;
  readonly reward_count: number;
  readonly purchase_count: number;
  readonly owned_count: number;
  readonly review_count: number;
  readonly analytics_count: number;
}

const ENTITY = 'confirmed_local_data_reset';
const MAX_TIMESTAMP = 8_640_000_000_000_000;

const validSeed = (seed: ConfirmedResetSeed): boolean =>
  Number.isSafeInteger(seed.nowMs) &&
  seed.nowMs >= 0 &&
  seed.nowMs <= MAX_TIMESTAMP &&
  seed.anonymousAnalyticsId.trim().length > 0;

const arraysEqual = <TValue>(
  left: readonly TValue[],
  right: readonly TValue[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => JSON.stringify(value) === JSON.stringify(right[index]));

const expectedCatalog = [...INITIAL_CATALOG_SEED]
  .sort((left, right) => left.id.localeCompare(right.id))
  .map((item) => ({
    id: item.id,
    display_name: item.displayName,
    category: item.category,
    price_coins: item.priceCoins,
    catalog_version: INITIAL_SCHEMA_VERSION,
  }));

const validateRetainedSurface = async (
  executor: SQLiteExecutor,
): Promise<PersistenceResult<readonly MigrationRow[]>> => {
  const tables = await executor.getAll<NameRow>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
    [],
  );
  if (!arraysEqual(tables.map(({ name }) => name), INITIAL_SCHEMA_TABLES)) {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', ENTITY, 'schema'),
    };
  }

  const catalog = await executor.getAll<CatalogRow>(
    `SELECT id, display_name, category, price_coins, catalog_version
     FROM catalog_items ORDER BY id`,
    [],
  );
  if (!arraysEqual(catalog, expectedCatalog)) {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', ENTITY, 'catalog'),
    };
  }

  const migrations = await executor.getAll<MigrationRow>(
    `SELECT version, name, checksum, applied_at
     FROM schema_migrations ORDER BY version`,
    [],
  );
  if (migrations.length === 0) {
    return {
      ok: false,
      error: persistenceError(
        'PERSISTENCE_INVARIANT_MISMATCH',
        ENTITY,
        'schema_migrations',
      ),
    };
  }
  return { ok: true, value: migrations };
};

const resetSingletons = async (
  executor: SQLiteExecutor,
  seed: ConfirmedResetSeed,
): Promise<void> => {
  await executor.run('DELETE FROM app_settings', []);
  await executor.run('DELETE FROM app_installation', []);
  await executor.run('DELETE FROM pet_profiles', []);
  await executor.run(
    `INSERT INTO app_installation (
      id, installed_at, onboarding_completed_at, anonymous_analytics_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, seed.nowMs, null, seed.anonymousAnalyticsId, seed.nowMs, seed.nowMs],
  );
  await executor.run(
    `INSERT INTO app_settings (
      id, focus_duration_minutes, short_break_minutes, long_break_minutes,
      default_mode, sound_enabled, haptics_enabled, notifications_enabled,
      analytics_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, 25, 5, 15, 'relax', 1, 1, 1, 1, seed.nowMs, seed.nowMs],
  );
  await executor.run(
    `INSERT INTO pet_profiles (
      id, total_xp, coin_balance, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [1, 0, 0, seed.nowMs, seed.nowMs],
  );
};

const verifyPostconditions = async (
  executor: SQLiteExecutor,
  seed: ConfirmedResetSeed,
  migrationBefore: readonly MigrationRow[],
): Promise<PersistenceResult<void>> => {
  const counts = await executor.getFirst<ResetPostconditionRow>(
    `SELECT
      (SELECT COUNT(*) FROM app_installation) AS installation_count,
      (SELECT COUNT(*) FROM app_settings) AS settings_count,
      (SELECT COUNT(*) FROM pet_profiles) AS profile_count,
      (SELECT COUNT(*) FROM sessions) AS session_count,
      (SELECT COUNT(*) FROM reward_transactions) AS reward_count,
      (SELECT COUNT(*) FROM purchase_transactions) AS purchase_count,
      (SELECT COUNT(*) FROM owned_items) AS owned_count,
      (SELECT COUNT(*) FROM store_review_attempts) AS review_count,
      (SELECT COUNT(*) FROM analytics_events) AS analytics_count`,
    [],
  );
  if (
    counts === null ||
    counts.installation_count !== 1 ||
    counts.settings_count !== 1 ||
    counts.profile_count !== 1 ||
    counts.session_count !== 0 ||
    counts.reward_count !== 0 ||
    counts.purchase_count !== 0 ||
    counts.owned_count !== 0 ||
    counts.review_count !== 0 ||
    counts.analytics_count !== 0
  ) {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', ENTITY, 'counts'),
    };
  }

  const installation = await executor.getFirst<{
    readonly installed_at: number;
    readonly onboarding_completed_at: number | null;
    readonly anonymous_analytics_id: string | null;
    readonly created_at: number;
    readonly updated_at: number;
  }>(
    `SELECT installed_at, onboarding_completed_at, anonymous_analytics_id,
      created_at, updated_at FROM app_installation WHERE id = 1`,
    [],
  );
  const settings = await executor.getFirst<{
    readonly focus_duration_minutes: number;
    readonly short_break_minutes: number;
    readonly long_break_minutes: number;
    readonly default_mode: string;
    readonly sound_enabled: number;
    readonly haptics_enabled: number;
    readonly notifications_enabled: number;
    readonly analytics_enabled: number;
    readonly created_at: number;
    readonly updated_at: number;
  }>(
    `SELECT focus_duration_minutes, short_break_minutes, long_break_minutes,
      default_mode, sound_enabled, haptics_enabled, notifications_enabled,
      analytics_enabled, created_at, updated_at
     FROM app_settings WHERE id = 1`,
    [],
  );
  const profile = await executor.getFirst<{
    readonly total_xp: number;
    readonly coin_balance: number;
    readonly created_at: number;
    readonly updated_at: number;
  }>(
    `SELECT total_xp, coin_balance, created_at, updated_at
     FROM pet_profiles WHERE id = 1`,
    [],
  );
  const migrationsAfter = await executor.getAll<MigrationRow>(
    `SELECT version, name, checksum, applied_at
     FROM schema_migrations ORDER BY version`,
    [],
  );

  const validSingletons =
    installation?.installed_at === seed.nowMs &&
    installation.onboarding_completed_at === null &&
    installation.anonymous_analytics_id === seed.anonymousAnalyticsId &&
    installation.created_at === seed.nowMs &&
    installation.updated_at === seed.nowMs &&
    settings?.focus_duration_minutes === 25 &&
    settings.short_break_minutes === 5 &&
    settings.long_break_minutes === 15 &&
    settings.default_mode === 'relax' &&
    settings.sound_enabled === 1 &&
    settings.haptics_enabled === 1 &&
    settings.notifications_enabled === 1 &&
    settings.analytics_enabled === 1 &&
    settings.created_at === seed.nowMs &&
    settings.updated_at === seed.nowMs &&
    profile?.total_xp === 0 &&
    profile.coin_balance === 0 &&
    profile.created_at === seed.nowMs &&
    profile.updated_at === seed.nowMs;
  if (!validSingletons || !arraysEqual(migrationsAfter, migrationBefore)) {
    return {
      ok: false,
      error: persistenceError('PERSISTENCE_INVARIANT_MISMATCH', ENTITY, 'postcondition'),
    };
  }

  const retained = await validateRetainedSurface(executor);
  return retained.ok ? { ok: true, value: undefined } : retained;
};

export class SQLiteConfirmedResetAdapter implements ConfirmedResetPersistencePort {
  constructor(private readonly transaction: SQLiteTransaction) {}

  resetInTransaction(
    scope: TransactionScope,
    seed: ConfirmedResetSeed,
  ): Promise<PersistenceResult<ConfirmedResetPersistenceSummary>> {
    if (!validSeed(seed)) {
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', ENTITY, 'seed'),
      });
    }

    return withTransactionExecutor(this.transaction, scope, ENTITY, async (executor) => {
      const retained = await validateRetainedSurface(executor);
      if (!retained.ok) return retained;

      const analytics = await executor.run('DELETE FROM analytics_events', []);
      const owned = await executor.run('DELETE FROM owned_items', []);
      const purchases = await executor.run('DELETE FROM purchase_transactions', []);
      const rewards = await executor.run('DELETE FROM reward_transactions', []);
      const sessions = await executor.run('DELETE FROM sessions', []);
      const reviews = await executor.run('DELETE FROM store_review_attempts', []);
      const summary: ConfirmedResetPersistenceSummary = {
        clearedAnalyticsEvents: analytics.changes,
        clearedOwnedItems: owned.changes,
        clearedPurchaseTransactions: purchases.changes,
        clearedRewardTransactions: rewards.changes,
        clearedSessions: sessions.changes,
        clearedStoreReviewAttempts: reviews.changes,
      };
      await resetSingletons(executor, seed);
      const postconditions = await verifyPostconditions(executor, seed, retained.value);
      return postconditions.ok
        ? { ok: true, value: summary }
        : postconditions;
    });
  }
}
