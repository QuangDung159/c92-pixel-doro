import {
  persistenceError,
  type CatalogRepository,
  type ProfileRepository,
  type TransactionScope,
} from '@pixeldoro/application';
import type {
  AppSettingsRepository,
  InstallationRepository,
} from '@/application';

import {
  mapCatalogItemRow,
  mapInstallationRow,
  mapProfileRow,
  mapSettingsRow,
} from '../mappers/foundation-row.mapper';
import { isNonEmptyString, isSafeTimestamp } from '../mappers/row-mapping';
import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import {
  mapWriteError,
  readMappedAll,
  readMappedOne,
  readWithOwner,
  withTransactionExecutor,
  writeWithOwner,
} from './sqlite-repository-support';

const installationSelect = `SELECT id, installed_at, onboarding_completed_at,
  anonymous_analytics_id, created_at, updated_at FROM app_installation WHERE id = 1`;
const settingsSelect = `SELECT id, focus_duration_minutes, short_break_minutes,
  long_break_minutes, default_mode, sound_enabled, haptics_enabled,
  notifications_enabled, analytics_enabled, created_at, updated_at
  FROM app_settings WHERE id = 1`;
const profileSelect = `SELECT id, total_xp, coin_balance, created_at, updated_at
  FROM pet_profiles WHERE id = 1`;
const catalogSelect = `SELECT id, display_name, category, price_coins, catalog_version,
  created_at, updated_at FROM catalog_items`;

export class SQLiteInstallationRepository implements InstallationRepository {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  find(): ReturnType<InstallationRepository['find']> {
    return readWithOwner(this.owner, 'app_installation', (executor) =>
      readMappedOne(executor, 'app_installation', installationSelect, [], mapInstallationRow));
  }

  setOnboardingCompleted(
    completedAt: number,
    updatedAt: number,
  ): ReturnType<InstallationRepository['setOnboardingCompleted']> {
    if (!isSafeTimestamp(completedAt) || !isSafeTimestamp(updatedAt)) {
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'app_installation', 'timestamp'),
      });
    }
    return writeWithOwner(this.owner, 'app_installation', async (executor) => {
      const result = await executor.run(
        `UPDATE app_installation SET onboarding_completed_at = ?, updated_at = ?
          WHERE id = 1 AND onboarding_completed_at IS NULL`,
        [completedAt, updatedAt],
      );
      return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
    });
  }

  setAnonymousAnalyticsId(
    anonymousAnalyticsId: string | null,
    updatedAt: number,
  ): ReturnType<InstallationRepository['setAnonymousAnalyticsId']> {
    if (
      (anonymousAnalyticsId !== null && !isNonEmptyString(anonymousAnalyticsId)) ||
      !isSafeTimestamp(updatedAt)
    ) {
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'app_installation', 'input'),
      });
    }
    return writeWithOwner(this.owner, 'app_installation', async (executor) => {
      const result = await executor.run(
        `UPDATE app_installation SET anonymous_analytics_id = ?, updated_at = ? WHERE id = 1`,
        [anonymousAnalyticsId, updatedAt],
      );
      return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
    });
  }
}

export class SQLiteAppSettingsRepository implements AppSettingsRepository {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  find(): ReturnType<AppSettingsRepository['find']> {
    return readWithOwner(this.owner, 'app_settings', (executor) =>
      readMappedOne(executor, 'app_settings', settingsSelect, [], mapSettingsRow));
  }

  replace(input: Parameters<AppSettingsRepository['replace']>[0]): ReturnType<AppSettingsRepository['replace']> {
    const valid = Number.isSafeInteger(input.focusDurationMinutes) &&
      input.focusDurationMinutes >= 15 && input.focusDurationMinutes <= 120 &&
      input.focusDurationMinutes % 5 === 0 && input.shortBreakMinutes === 5 &&
      input.longBreakMinutes === 15 && isSafeTimestamp(input.updatedAt);
    if (!valid) {
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'app_settings', 'input'),
      });
    }
    return writeWithOwner(this.owner, 'app_settings', async (executor) => {
      const result = await executor.run(
        `UPDATE app_settings SET focus_duration_minutes = ?, short_break_minutes = ?,
          long_break_minutes = ?, default_mode = ?, sound_enabled = ?, haptics_enabled = ?,
          notifications_enabled = ?, analytics_enabled = ?, updated_at = ? WHERE id = 1`,
        [input.focusDurationMinutes, input.shortBreakMinutes, input.longBreakMinutes,
          input.defaultMode, input.soundEnabled ? 1 : 0, input.hapticsEnabled ? 1 : 0,
          input.notificationsEnabled ? 1 : 0, input.analyticsEnabled ? 1 : 0, input.updatedAt],
      );
      return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
    });
  }
}

export class SQLiteProfileRepository implements ProfileRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  find(): ReturnType<ProfileRepository['find']> {
    return readWithOwner(this.owner, 'pet_profiles', (executor) => this.read(executor));
  }

  findInTransaction(scope: TransactionScope): ReturnType<ProfileRepository['findInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'pet_profiles', (executor) =>
      this.read(executor));
  }

  applyProgressionInTransaction(
    scope: TransactionScope,
    input: Parameters<ProfileRepository['applyProgressionInTransaction']>[1],
  ): ReturnType<ProfileRepository['applyProgressionInTransaction']> {
    if (
      input.profileId !== 1 || !Number.isSafeInteger(input.xpDelta) ||
      !Number.isSafeInteger(input.coinDelta) || !isSafeTimestamp(input.updatedAt)
    ) return Promise.resolve({
      ok: false,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'pet_profiles', 'input'),
    });
    return withTransactionExecutor(this.transaction, scope, 'pet_profiles', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE pet_profiles SET total_xp = total_xp + ?,
            coin_balance = coin_balance + ?, updated_at = ?
            WHERE id = ? AND total_xp + ? >= 0 AND coin_balance + ? >= 0`,
          [input.xpDelta, input.coinDelta, input.updatedAt, input.profileId,
            input.xpDelta, input.coinDelta],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'pet_profiles') };
      }
    });
  }

  debitCatalogItemInTransaction(
    scope: TransactionScope,
    input: Parameters<ProfileRepository['debitCatalogItemInTransaction']>[1],
  ): ReturnType<ProfileRepository['debitCatalogItemInTransaction']> {
    if (input.profileId !== 1 || !isNonEmptyString(input.itemId) || !isSafeTimestamp(input.updatedAt)) {
      return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'pet_profiles', 'input'),
      });
    }
    return withTransactionExecutor(this.transaction, scope, 'pet_profiles', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE pet_profiles SET
            coin_balance = coin_balance - (SELECT price_coins FROM catalog_items WHERE id = ?),
            updated_at = ?
            WHERE id = ? AND EXISTS (SELECT 1 FROM catalog_items WHERE id = ?)
              AND coin_balance >= (SELECT price_coins FROM catalog_items WHERE id = ?)`,
          [input.itemId, input.updatedAt, input.profileId, input.itemId, input.itemId],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'pet_profiles') };
      }
    });
  }

  private read(executor: SQLiteExecutor): ReturnType<ProfileRepository['find']> {
    return readMappedOne(executor, 'pet_profiles', profileSelect, [], mapProfileRow);
  }
}

export class SQLiteCatalogRepository implements CatalogRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  findById(id: string): ReturnType<CatalogRepository['findById']> {
    return readWithOwner(this.owner, 'catalog_items', (executor) =>
      this.readById(executor, id));
  }

  list(): ReturnType<CatalogRepository['list']> {
    return readWithOwner(this.owner, 'catalog_items', (executor) =>
      readMappedAll(executor, 'catalog_items', `${catalogSelect} ORDER BY price_coins, id`, [], mapCatalogItemRow));
  }

  findByIdInTransaction(
    scope: TransactionScope,
    id: string,
  ): ReturnType<CatalogRepository['findByIdInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'catalog_items', (executor) =>
      this.readById(executor, id));
  }

  private readById(executor: SQLiteExecutor, id: string): ReturnType<CatalogRepository['findById']> {
    if (!isNonEmptyString(id)) return Promise.resolve({
      ok: false,
      error: persistenceError('PERSISTENCE_QUERY_FAILED', 'catalog_items', 'id'),
    });
    return readMappedOne(executor, 'catalog_items', `${catalogSelect} WHERE id = ?`, [id], mapCatalogItemRow);
  }
}
