import {
  bootstrapDataError,
  type BootstrapDataPort,
  type BootstrapDurableSnapshot,
} from '@/application';

import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import { SQLiteExecutor } from '../sqlite-executor';
import {
  mapCatalogItemRow,
  mapInstallationRow,
  mapProfileRow,
  mapSettingsRow,
  type CatalogItemRow,
  type InstallationRow,
  type ProfileRow,
  type SettingsRow,
} from '../mappers/foundation-row.mapper';

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

export type BootstrapInstallationRow = InstallationRow;
export type BootstrapSettingsRow = SettingsRow;
export type BootstrapProfileRow = ProfileRow;
export type BootstrapCatalogRow = CatalogItemRow;

export interface BootstrapRows {
  readonly migrations: readonly BootstrapMigrationRow[];
  readonly installations: readonly BootstrapInstallationRow[];
  readonly settings: readonly BootstrapSettingsRow[];
  readonly profiles: readonly BootstrapProfileRow[];
  readonly catalog: readonly BootstrapCatalogRow[];
}

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
    migration.version <= 0
  ) {
    return undefined;
  }

  const installationMapping = mapInstallationRow(installation);
  const settingsMapping = mapSettingsRow(settings);
  const profileMapping = mapProfileRow(profile);
  const catalogMappings = rows.catalog.map(mapCatalogItemRow);
  if (
    !installationMapping.ok ||
    !settingsMapping.ok ||
    !profileMapping.ok ||
    catalogMappings.some((item) => !item.ok)
  ) {
    return undefined;
  }
  const installationRecord = installationMapping.value;
  const settingsRecord = settingsMapping.value;
  const profileRecord = profileMapping.value;
  const catalog = catalogMappings.map((item) => {
    if (!item.ok) throw new Error('Unreachable invalid catalog mapping');
    return item.value;
  });

  return freezeSnapshot({
    migrationVersion: migration.version,
    installation: {
      installedAt: installationRecord.installedAt,
      onboardingCompletedAt: installationRecord.onboardingCompletedAt,
    },
    settings: {
      focusDurationMinutes: settingsRecord.focusDurationMinutes,
      shortBreakMinutes: settingsRecord.shortBreakMinutes,
      longBreakMinutes: settingsRecord.longBreakMinutes,
      defaultMode: settingsRecord.defaultMode,
      soundEnabled: settingsRecord.soundEnabled,
      hapticsEnabled: settingsRecord.hapticsEnabled,
      notificationsEnabled: settingsRecord.notificationsEnabled,
      analyticsEnabled: settingsRecord.analyticsEnabled,
    },
    profile: {
      totalXp: profileRecord.totalXp,
      coinBalance: profileRecord.coinBalance,
    },
    catalog,
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
        return {
          ok: false,
          error: bootstrapDataError('BOOTSTRAP_DATA_INVALID'),
        };
      }
      return { ok: true, value: snapshot };
    } catch {
      return { ok: false, error: bootstrapDataError('DATABASE_READ_FAILED') };
    }
  }
}
