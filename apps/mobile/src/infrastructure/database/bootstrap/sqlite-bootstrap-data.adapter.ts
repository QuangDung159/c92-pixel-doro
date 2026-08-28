import {
  bootstrapDataError,
  type BootstrapDataPort,
  type BootstrapDurableSnapshot,
} from '@/application';

import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import { SQLiteExecutor } from '../sqlite-executor';

const MAX_TIMESTAMP = 8_640_000_000_000_000;

export const bootstrapDataSql = {
  migrationHistory: `SELECT version
    FROM schema_migrations
    ORDER BY version`,
  installation: `SELECT
      id,
      installed_at,
      onboarding_completed_at,
      anonymous_analytics_id,
      created_at,
      updated_at
    FROM app_installation
    ORDER BY id`,
  settings: `SELECT
      id,
      focus_duration_minutes,
      short_break_minutes,
      long_break_minutes,
      default_mode,
      sound_enabled,
      haptics_enabled,
      notifications_enabled,
      analytics_enabled,
      created_at,
      updated_at
    FROM app_settings
    ORDER BY id`,
  profile: `SELECT id, total_xp, coin_balance, created_at, updated_at
    FROM pet_profiles
    ORDER BY id`,
  catalog: `SELECT
      id,
      display_name,
      category,
      price_coins,
      catalog_version,
      created_at,
      updated_at
    FROM catalog_items
    ORDER BY price_coins, id`,
} as const;

export interface BootstrapMigrationRow {
  readonly version: number;
}

export interface BootstrapInstallationRow {
  readonly id: number;
  readonly installed_at: number;
  readonly onboarding_completed_at: number | null;
  readonly anonymous_analytics_id: string | null;
  readonly created_at: number;
  readonly updated_at: number;
}

export interface BootstrapSettingsRow {
  readonly id: number;
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
}

export interface BootstrapProfileRow {
  readonly id: number;
  readonly total_xp: number;
  readonly coin_balance: number;
  readonly created_at: number;
  readonly updated_at: number;
}

export interface BootstrapCatalogRow {
  readonly id: string;
  readonly display_name: string;
  readonly category: string;
  readonly price_coins: number;
  readonly catalog_version: number;
  readonly created_at: number;
  readonly updated_at: number;
}

export interface BootstrapRows {
  readonly migrations: readonly BootstrapMigrationRow[];
  readonly installations: readonly BootstrapInstallationRow[];
  readonly settings: readonly BootstrapSettingsRow[];
  readonly profiles: readonly BootstrapProfileRow[];
  readonly catalog: readonly BootstrapCatalogRow[];
}

const isSafeTimestamp = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= MAX_TIMESTAMP;

const isNonNegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isSQLiteBoolean = (value: unknown): value is 0 | 1 =>
  value === 0 || value === 1;

const freezeSnapshot = (
  snapshot: BootstrapDurableSnapshot,
): BootstrapDurableSnapshot => {
  snapshot.catalog.forEach(Object.freeze);
  Object.freeze(snapshot.catalog);
  Object.freeze(snapshot.installation);
  Object.freeze(snapshot.settings);
  Object.freeze(snapshot.profile);
  return Object.freeze(snapshot);
};

export const mapBootstrapRows = (
  rows: BootstrapRows,
): BootstrapDurableSnapshot | undefined => {
  if (
    rows.migrations.length === 0 ||
    rows.installations.length !== 1 ||
    rows.settings.length !== 1 ||
    rows.profiles.length !== 1
  ) {
    return undefined;
  }

  const migration = rows.migrations.at(-1);
  const installation = rows.installations[0];
  const settings = rows.settings[0];
  const profile = rows.profiles[0];
  if (
    migration === undefined ||
    installation === undefined ||
    settings === undefined ||
    profile === undefined ||
    !Number.isSafeInteger(migration.version) ||
    migration.version <= 0 ||
    installation.id !== 1 ||
    !isSafeTimestamp(installation.installed_at) ||
    (installation.onboarding_completed_at !== null &&
      !isSafeTimestamp(installation.onboarding_completed_at)) ||
    (installation.anonymous_analytics_id !== null &&
      (typeof installation.anonymous_analytics_id !== 'string' ||
        installation.anonymous_analytics_id.length === 0)) ||
    !isSafeTimestamp(installation.created_at) ||
    !isSafeTimestamp(installation.updated_at) ||
    settings.id !== 1 ||
    !Number.isSafeInteger(settings.focus_duration_minutes) ||
    settings.focus_duration_minutes < 15 ||
    settings.focus_duration_minutes > 120 ||
    settings.focus_duration_minutes % 5 !== 0 ||
    settings.short_break_minutes !== 5 ||
    settings.long_break_minutes !== 15 ||
    (settings.default_mode !== 'relax' && settings.default_mode !== 'strict') ||
    !isSQLiteBoolean(settings.sound_enabled) ||
    !isSQLiteBoolean(settings.haptics_enabled) ||
    !isSQLiteBoolean(settings.notifications_enabled) ||
    !isSQLiteBoolean(settings.analytics_enabled) ||
    !isSafeTimestamp(settings.created_at) ||
    !isSafeTimestamp(settings.updated_at) ||
    profile.id !== 1 ||
    !isNonNegativeSafeInteger(profile.total_xp) ||
    !isNonNegativeSafeInteger(profile.coin_balance) ||
    !isSafeTimestamp(profile.created_at) ||
    !isSafeTimestamp(profile.updated_at)
  ) {
    return undefined;
  }

  const catalog = rows.catalog.map((item) => {
    if (
      typeof item.id !== 'string' ||
      item.id.length === 0 ||
      typeof item.display_name !== 'string' ||
      item.display_name.length === 0 ||
      item.category !== 'furniture' ||
      !Number.isSafeInteger(item.price_coins) ||
      item.price_coins <= 0 ||
      !Number.isSafeInteger(item.catalog_version) ||
      item.catalog_version <= 0 ||
      !isSafeTimestamp(item.created_at) ||
      !isSafeTimestamp(item.updated_at)
    ) {
      return undefined;
    }

    return {
      id: item.id,
      displayName: item.display_name,
      category: item.category,
      priceCoins: item.price_coins,
      catalogVersion: item.catalog_version,
    } as const;
  });
  if (catalog.some((item) => item === undefined)) {
    return undefined;
  }

  return freezeSnapshot({
    migrationVersion: migration.version,
    installation: {
      installedAt: installation.installed_at,
      onboardingCompletedAt: installation.onboarding_completed_at,
    },
    settings: {
      focusDurationMinutes: settings.focus_duration_minutes,
      shortBreakMinutes: settings.short_break_minutes,
      longBreakMinutes: settings.long_break_minutes,
      defaultMode: settings.default_mode,
      soundEnabled: settings.sound_enabled === 1,
      hapticsEnabled: settings.haptics_enabled === 1,
      notificationsEnabled: settings.notifications_enabled === 1,
      analyticsEnabled: settings.analytics_enabled === 1,
    },
    profile: {
      totalXp: profile.total_xp,
      coinBalance: profile.coin_balance,
    },
    catalog: catalog as BootstrapDurableSnapshot['catalog'],
  });
};

export const readBootstrapRows = async (
  owner: SQLiteDatabaseOwner,
): Promise<BootstrapRows> =>
  owner.withConnection(async (connection) => {
    const executor = new SQLiteExecutor(connection);
    const migrations = await executor.getAll<BootstrapMigrationRow>(
      bootstrapDataSql.migrationHistory,
      [],
    );
    const installations = await executor.getAll<BootstrapInstallationRow>(
      bootstrapDataSql.installation,
      [],
    );
    const settings = await executor.getAll<BootstrapSettingsRow>(
      bootstrapDataSql.settings,
      [],
    );
    const profiles = await executor.getAll<BootstrapProfileRow>(
      bootstrapDataSql.profile,
      [],
    );
    const catalog = await executor.getAll<BootstrapCatalogRow>(
      bootstrapDataSql.catalog,
      [],
    );

    return { migrations, installations, settings, profiles, catalog };
  });

export class SQLiteBootstrapDataAdapter implements BootstrapDataPort {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  async read(): ReturnType<BootstrapDataPort['read']> {
    try {
      const snapshot = mapBootstrapRows(await readBootstrapRows(this.owner));
      if (snapshot === undefined) {
        return { ok: false, error: bootstrapDataError() };
      }
      return { ok: true, value: snapshot };
    } catch {
      return { ok: false, error: bootstrapDataError() };
    }
  }
}
