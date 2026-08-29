import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ResetNotificationCleanupPort } from '@/application';
import { INITIAL_SCHEMA_TABLES } from '@/infrastructure/database/migrations/schema-manifest';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';

import { createMobileApplication } from '../create-mobile-application';
import type { MobileApplication } from '../mobile-application';

const SUCCESS_DATABASE = 'pixeldoro-us-02-08-confirmed-reset-probe.db';
const FAILURE_DATABASE = 'pixeldoro-us-02-08-confirmed-reset-failure-probe.db';
const BASE_TIME = 1_787_836_800_000;
const RESET_TIME = BASE_TIME + 86_400_000;

export interface ConfirmedResetProbeReport {
  readonly probe: 'US-02-08_CONFIRMED_RESET';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly sqliteVersion: string;
  readonly assertions: readonly string[];
}

class FaultInjectingConnection {
  constructor(
    private readonly connection: SQLiteConnection,
    private readonly driver: FaultInjectingDriver,
  ) {}

  closeAsync(): Promise<void> {
    return this.connection.closeAsync();
  }

  execAsync(sql: string): Promise<void> {
    return this.connection.execAsync(sql);
  }

  runAsync(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult> {
    if (
      this.driver.failRunContaining !== null &&
      sql.includes(this.driver.failRunContaining)
    ) {
      this.driver.failRunContaining = null;
      return Promise.reject(new Error('native provider detail must be sanitized'));
    }
    return this.connection.runAsync(sql, parameters);
  }

  getFirstAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    return this.connection.getFirstAsync<TRow>(sql, parameters);
  }

  getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    return this.connection.getAllAsync<TRow>(sql, parameters);
  }
}

class FaultInjectingDriver implements SQLiteDriver {
  failRunContaining: string | null = null;

  constructor(private readonly driver: SQLiteDriver) {}

  async openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return new FaultInjectingConnection(
      await this.driver.openDatabase(databaseName),
      this,
    ) as unknown as SQLiteConnection;
  }

  deleteDatabase(databaseName: string): Promise<void> {
    return this.driver.deleteDatabase(databaseName);
  }
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  assertions: string[],
): void => {
  if (!condition) throw new Error(assertion);
  assertions.push(assertion);
};

const removeStaleDatabase = async (
  driver: SQLiteDriver,
  databaseName: string,
): Promise<void> => {
  try {
    await driver.deleteDatabase(databaseName);
  } catch {
    // Missing isolated probe state is a valid starting point.
  }
};

const createProbeApplication = (
  driver: SQLiteDriver,
  databaseName: string,
  notificationCleanup: ResetNotificationCleanupPort,
): MobileApplication => {
  let idSequence = 0;
  return createMobileApplication({
    appLifecycle: {
      getCurrentState: () => 'active',
      subscribe: () => () => undefined,
    },
    clock: { nowMs: () => RESET_TIME },
    confirmedResetDiagnostics: { record: () => undefined },
    databaseName,
    diagnosticsEnabled: false,
    id: { nextId: () => `native-reset-id-${++idSequence}` },
    resetNotificationCleanup: notificationCleanup,
    sqliteDriver: driver,
  });
};

const seedProductFixture = async (application: MobileApplication): Promise<void> => {
  const result = await application.transaction.execute(async (scope) => {
    const executor = application.transaction.executorFor(scope);
    await executor.run(
      `UPDATE app_installation SET onboarding_completed_at = ?, updated_at = ? WHERE id = 1`,
      [BASE_TIME + 1, BASE_TIME + 1],
    );
    await executor.run(
      `UPDATE app_settings SET focus_duration_minutes = 50, default_mode = 'strict',
       sound_enabled = 0, haptics_enabled = 0, notifications_enabled = 0,
       analytics_enabled = 0, updated_at = ? WHERE id = 1`,
      [BASE_TIME + 1],
    );
    await executor.run(
      `UPDATE pet_profiles SET total_xp = 25, coin_balance = 0, updated_at = ? WHERE id = 1`,
      [BASE_TIME + 1],
    );
    await executor.run(
      `INSERT INTO sessions (
        id, profile_id, session_type, focus_variant, mode, status, work_tag,
        configured_duration_minutes, started_at, ends_at, backgrounded_at,
        resolved_at, xp_earned, coins_earned, reward_claimed_at,
        scheduled_end_local_date, scheduled_end_utc_offset_minutes,
        created_at, updated_at
      ) VALUES ('native-reset-session', 1, 'focus', 'standard', 'relax',
        'completed', 'coding', 25, ?, ?, NULL, ?, 25, 5, ?,
        '2026-08-28', 420, ?, ?)`,
      [
        BASE_TIME,
        BASE_TIME + 1_500_000,
        BASE_TIME + 1_500_000,
        BASE_TIME + 1_500_000,
        BASE_TIME,
        BASE_TIME + 1_500_000,
      ],
    );
    await executor.run(
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES ('native-reset-reward', 'native-reset-session', 1, 25, 5,
        'focus_completed', ?)`,
      [BASE_TIME + 1_500_000],
    );
    await executor.run(
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES ('native-reset-purchase', 1, 'desk-mug', 5, -5,
        'item_purchase', ?)`,
      [BASE_TIME + 1_600_000],
    );
    await executor.run(
      `INSERT INTO owned_items (
        profile_id, item_id, purchase_transaction_id, unlocked_at,
        is_equipped, equipped_at, updated_at
      ) VALUES (1, 'desk-mug', 'native-reset-purchase', ?, 0, NULL, ?)`,
      [BASE_TIME + 1_600_000, BASE_TIME + 1_600_000],
    );
    await executor.run(
      `INSERT INTO store_review_attempts (
        id, app_version, attempted_at, created_at
      ) VALUES ('native-reset-review', '0.1.0', ?, ?)`,
      [BASE_TIME + 1_700_000, BASE_TIME + 1_700_000],
    );
    await executor.run(
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES ('native-reset-event', 'focus_session_started', '{}', ?, ?,
        'pending', 0, NULL, ?)`,
      [BASE_TIME, BASE_TIME + 604_800_000, BASE_TIME],
    );
    return { ok: true as const, value: undefined };
  });
  if (!result.ok) throw new Error('seed_product_fixture_failed');
};

interface DurableFacts {
  readonly productCount: number;
  readonly catalogCount: number;
  readonly migrationCount: number;
  readonly triggerCount: number;
  readonly indexCount: number;
  readonly totalXp: number;
  readonly coinBalance: number;
  readonly installedAt: number;
  readonly onboardingCompletedAt: number | null;
  readonly anonymousAnalyticsId: string | null;
  readonly focusMinutes: number;
  readonly defaultMode: string;
  readonly analyticsEnabled: number;
}

const readFacts = async (application: MobileApplication): Promise<DurableFacts> => {
  const result = await application.transaction.execute(async (scope) => {
    const executor = application.transaction.executorFor(scope);
    const facts = await executor.getFirst<DurableFacts>(
      `SELECT
        (SELECT COUNT(*) FROM sessions) +
        (SELECT COUNT(*) FROM reward_transactions) +
        (SELECT COUNT(*) FROM purchase_transactions) +
        (SELECT COUNT(*) FROM owned_items) +
        (SELECT COUNT(*) FROM store_review_attempts) +
        (SELECT COUNT(*) FROM analytics_events) AS productCount,
        (SELECT COUNT(*) FROM catalog_items) AS catalogCount,
        (SELECT COUNT(*) FROM schema_migrations) AS migrationCount,
        (SELECT COUNT(*) FROM sqlite_master WHERE type = 'trigger') AS triggerCount,
        (SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%') AS indexCount,
        (SELECT total_xp FROM pet_profiles WHERE id = 1) AS totalXp,
        (SELECT coin_balance FROM pet_profiles WHERE id = 1) AS coinBalance,
        (SELECT installed_at FROM app_installation WHERE id = 1) AS installedAt,
        (SELECT onboarding_completed_at FROM app_installation WHERE id = 1) AS onboardingCompletedAt,
        (SELECT anonymous_analytics_id FROM app_installation WHERE id = 1) AS anonymousAnalyticsId,
        (SELECT focus_duration_minutes FROM app_settings WHERE id = 1) AS focusMinutes,
        (SELECT default_mode FROM app_settings WHERE id = 1) AS defaultMode,
        (SELECT analytics_enabled FROM app_settings WHERE id = 1) AS analyticsEnabled`,
      [],
    );
    if (facts === null) return { ok: false as const, error: { code: 'MISSING_FACTS' } };
    return { ok: true as const, value: facts };
  });
  if (!result.ok) throw new Error('read_reset_facts_failed');
  return result.value;
};

const fingerprint = async (application: MobileApplication): Promise<string> => {
  const result = await application.transaction.execute(async (scope) => {
    const executor = application.transaction.executorFor(scope);
    const rows: Record<string, readonly unknown[]> = {};
    for (const table of INITIAL_SCHEMA_TABLES) {
      rows[table] = await executor.getAll<unknown>(
        `SELECT * FROM ${table} ORDER BY rowid`,
        [],
      );
    }
    const objects = await executor.getAll<unknown>(
      `SELECT type, name, tbl_name, sql FROM sqlite_master
       WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name`,
      [],
    );
    return { ok: true as const, value: JSON.stringify({ objects, rows }) };
  });
  if (!result.ok) throw new Error('reset_fingerprint_failed');
  return result.value;
};

const sqliteVersionFor = async (application: MobileApplication): Promise<string> => {
  const result = await application.transaction.execute(async (scope) => {
    const row = await application.transaction.executorFor(scope).getFirst<{
      version: string;
    }>('SELECT sqlite_version() AS version', []);
    return { ok: true as const, value: row?.version ?? 'unavailable' };
  });
  return result.ok ? result.value : 'unavailable';
};

const disposeSafely = async (applications: readonly MobileApplication[]): Promise<boolean> => {
  try {
    await Promise.all(applications.map((application) => application.dispose()));
    return true;
  } catch {
    return false;
  }
};

export const runConfirmedResetProbe = async (
  baseDriver: SQLiteDriver,
): Promise<ConfirmedResetProbeReport> => {
  const assertions: string[] = [];
  const applications: MobileApplication[] = [];
  const driver = new FaultInjectingDriver(baseDriver);
  let failedAssertion: string | undefined;
  let sqliteVersion = 'unavailable';

  await removeStaleDatabase(driver, SUCCESS_DATABASE);
  await removeStaleDatabase(driver, FAILURE_DATABASE);

  try {
    const failingCleanup: ResetNotificationCleanupPort = {
      cancelKnownSession: () =>
        Promise.resolve({
          ok: false,
          error: {
            kind: 'reset_notification_cleanup_error',
            code: 'RESET_NOTIFICATION_CLEANUP_FAILED',
          },
        }),
    };
    const application = createProbeApplication(
      driver,
      SUCCESS_DATABASE,
      failingCleanup,
    );
    applications.push(application);
    await application.boot();
    sqliteVersion = await sqliteVersionFor(application);
    assertProbe(
      application.bootstrap.getSnapshot().status === 'ready',
      'reset_probe_database_opened_and_migrated',
      assertions,
    );

    await seedProductFixture(application);
    const fixture = await readFacts(application);
    assertProbe(
      fixture.productCount === 6 &&
        fixture.catalogCount === 12 &&
        fixture.migrationCount === 1 &&
        fixture.totalXp === 25,
      'complete_pre_reset_product_fixture_was_verified',
      assertions,
    );

    const beforeUnconfirmed = await fingerprint(application);
    application.criticalRecovery.enterRecovery('DATABASE_WRITE_FAILED');
    await application.retryRecovery();
    assertProbe(
      beforeUnconfirmed === (await fingerprint(application)),
      'unconfirmed_and_recovery_paths_could_not_invoke_reset',
      assertions,
    );

    application.criticalRecovery.enterRecovery('DATABASE_WRITE_FAILED');
    const firstReset = application.confirmedReset.execute();
    const concurrentReset = application.confirmedReset.execute();
    const resetResult = await firstReset;
    assertProbe(
      resetResult.ok &&
        resetResult.warnings?.some(
          ({ code }) => code === 'NOTIFICATION_CLEANUP_FAILED',
        ) === true,
      'notification_cleanup_failure_was_best_effort',
      assertions,
    );
    assertProbe(
      concurrentReset === firstReset && resetResult.ok,
      'confirmed_reset_committed_atomically',
      assertions,
    );

    const resetFacts = await readFacts(application);
    assertProbe(
      resetFacts.productCount === 0 &&
        resetFacts.totalXp === 0 &&
        resetFacts.coinBalance === 0,
      'product_history_economy_and_metadata_were_cleared',
      assertions,
    );
    assertProbe(
      resetFacts.installedAt === RESET_TIME &&
        resetFacts.onboardingCompletedAt === null &&
        resetFacts.anonymousAnalyticsId === 'native-reset-id-2' &&
        resetFacts.focusMinutes === 25 &&
        resetFacts.defaultMode === 'relax' &&
        resetFacts.analyticsEnabled === 1,
      'singletons_reseeded_and_anonymous_identity_rotated',
      assertions,
    );
    assertProbe(
      resetFacts.catalogCount === 12 &&
        resetFacts.migrationCount === 1 &&
        resetFacts.triggerCount > 0 &&
        resetFacts.indexCount > 0,
      'schema_history_triggers_indexes_and_exact_catalog_were_preserved',
      assertions,
    );
    const resetProjection = application.bootstrap.getSnapshot();
    assertProbe(
      resetProjection.status === 'ready' &&
        resetProjection.snapshot.profile.totalXp === 0 &&
        resetProjection.snapshot.settings.focusDurationMinutes === 25 &&
        resetProjection.snapshot.catalog.length === 12,
      'post_reset_bootstrap_hydrated_fresh_defaults_before_ready',
      assertions,
    );

    const rollbackApplication = createProbeApplication(
      driver,
      FAILURE_DATABASE,
      { cancelKnownSession: () => Promise.resolve({ ok: true, value: undefined }) },
    );
    applications.push(rollbackApplication);
    await rollbackApplication.boot();
    await seedProductFixture(rollbackApplication);
    const beforeFailure = await fingerprint(rollbackApplication);
    driver.failRunContaining = 'DELETE FROM reward_transactions';
    const failedReset = await rollbackApplication.confirmedReset.execute();
    assertProbe(
      !failedReset.ok &&
        failedReset.error.code === 'RESET_PERSISTENCE_FAILED' &&
        beforeFailure === (await fingerprint(rollbackApplication)) &&
        rollbackApplication.bootstrap.getSnapshot().status === 'ready',
      'injected_mid_reset_failure_restored_complete_fingerprint',
      assertions,
    );

    const repeated = await application.confirmedReset.execute();
    const firstDispose = application.dispose();
    const secondDispose = application.dispose();
    await Promise.all([firstDispose, secondDispose]);
    assertProbe(
      repeated.ok &&
        firstDispose === secondDispose &&
        application.bootstrap.getSnapshot().status === 'disposed',
      'concurrent_repeated_reset_and_dispose_were_safe',
      assertions,
    );
  } catch (error) {
    failedAssertion =
      error instanceof Error ? error.message : 'unknown_confirmed_reset_failure';
  } finally {
    const applicationsClosed = await disposeSafely(applications);
    if (!applicationsClosed) {
      failedAssertion ??= 'probe_database_not_closed';
    } else {
      try {
        await driver.deleteDatabase(SUCCESS_DATABASE);
        await driver.deleteDatabase(FAILURE_DATABASE);
        if (failedAssertion === undefined) {
          assertions.push('probe_connections_closed_and_databases_cleaned');
        }
      } catch {
        failedAssertion ??= 'probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-08_CONFIRMED_RESET',
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    applicationId:
      (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) ?? 'unknown',
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
    sqliteVersion,
    assertions,
  };
};
