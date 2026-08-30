import type {
  CatalogItemRecord,
  ProfileRecord,
} from '@pixeldoro/application';
import type {
  AppSettingsRecord,
  InstallationRecord,
} from '@/application';

import {
  corrupt,
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isPositiveSafeInteger,
  isSafeTimestamp,
  isSQLiteBoolean,
  mapped,
  type RowMapping,
} from './row-mapping';

export interface InstallationRow {
  readonly id: unknown;
  readonly installed_at: unknown;
  readonly onboarding_completed_at: unknown;
  readonly anonymous_analytics_id: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
}

export interface SettingsRow {
  readonly id: unknown;
  readonly focus_duration_minutes: unknown;
  readonly short_break_minutes: unknown;
  readonly long_break_minutes: unknown;
  readonly default_mode: unknown;
  readonly sound_enabled: unknown;
  readonly haptics_enabled: unknown;
  readonly notifications_enabled: unknown;
  readonly analytics_enabled: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
}

export interface ProfileRow {
  readonly id: unknown;
  readonly total_xp: unknown;
  readonly coin_balance: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
}

export interface CatalogItemRow {
  readonly id: unknown;
  readonly display_name: unknown;
  readonly category: unknown;
  readonly price_coins: unknown;
  readonly catalog_version: unknown;
  readonly created_at: unknown;
  readonly updated_at: unknown;
}

export const mapInstallationRow = (
  row: InstallationRow,
): RowMapping<InstallationRecord> => {
  if (row.id !== 1) return corrupt('id');
  if (!isSafeTimestamp(row.installed_at)) return corrupt('installed_at');
  if (
    row.onboarding_completed_at !== null &&
    !isSafeTimestamp(row.onboarding_completed_at)
  ) return corrupt('onboarding_completed_at');
  if (
    row.anonymous_analytics_id !== null &&
    !isNonEmptyString(row.anonymous_analytics_id)
  ) return corrupt('anonymous_analytics_id');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');

  return mapped({
    id: 1,
    installedAt: row.installed_at,
    onboardingCompletedAt: row.onboarding_completed_at,
    anonymousAnalyticsId: row.anonymous_analytics_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export const mapSettingsRow = (
  row: SettingsRow,
): RowMapping<AppSettingsRecord> => {
  if (row.id !== 1) return corrupt('id');
  if (
    !Number.isSafeInteger(row.focus_duration_minutes) ||
    typeof row.focus_duration_minutes !== 'number' ||
    row.focus_duration_minutes < 15 ||
    row.focus_duration_minutes > 120 ||
    row.focus_duration_minutes % 5 !== 0
  ) return corrupt('focus_duration_minutes');
  if (row.short_break_minutes !== 5) return corrupt('short_break_minutes');
  if (row.long_break_minutes !== 15) return corrupt('long_break_minutes');
  if (row.default_mode !== 'relax' && row.default_mode !== 'strict') {
    return corrupt('default_mode');
  }
  if (!isSQLiteBoolean(row.sound_enabled)) return corrupt('sound_enabled');
  if (!isSQLiteBoolean(row.haptics_enabled)) return corrupt('haptics_enabled');
  if (!isSQLiteBoolean(row.notifications_enabled)) {
    return corrupt('notifications_enabled');
  }
  if (!isSQLiteBoolean(row.analytics_enabled)) {
    return corrupt('analytics_enabled');
  }
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');

  return mapped({
    id: 1,
    focusDurationMinutes: row.focus_duration_minutes,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    defaultMode: row.default_mode,
    soundEnabled: row.sound_enabled === 1,
    hapticsEnabled: row.haptics_enabled === 1,
    notificationsEnabled: row.notifications_enabled === 1,
    analyticsEnabled: row.analytics_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export const mapProfileRow = (
  row: ProfileRow,
): RowMapping<ProfileRecord> => {
  if (row.id !== 1) return corrupt('id');
  if (!isNonNegativeSafeInteger(row.total_xp)) return corrupt('total_xp');
  if (!isNonNegativeSafeInteger(row.coin_balance)) return corrupt('coin_balance');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');

  return mapped({
    id: 1,
    totalXp: row.total_xp,
    coinBalance: row.coin_balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export const mapCatalogItemRow = (
  row: CatalogItemRow,
): RowMapping<CatalogItemRecord> => {
  if (!isNonEmptyString(row.id)) return corrupt('id');
  if (!isNonEmptyString(row.display_name)) return corrupt('display_name');
  if (row.category !== 'furniture') return corrupt('category');
  if (!isPositiveSafeInteger(row.price_coins)) return corrupt('price_coins');
  if (!isPositiveSafeInteger(row.catalog_version)) return corrupt('catalog_version');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');

  return mapped({
    id: row.id,
    displayName: row.display_name,
    category: 'furniture',
    priceCoins: row.price_coins,
    catalogVersion: row.catalog_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};
