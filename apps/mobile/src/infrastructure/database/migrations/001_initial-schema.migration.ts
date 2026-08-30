import type {
  ApplicationResult,
  TransactionTechnicalError,
} from '@pixeldoro/application';

import type { SQLiteTransaction } from '../sqlite-transaction';
import type {
  SQLiteParameters,
  SQLiteWriteResult,
} from '../sqlite-driver';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_NAME,
  INITIAL_SCHEMA_TABLES,
  INITIAL_SCHEMA_VERSION,
} from './schema-manifest';

const MAX_TIMESTAMP = 8_640_000_000_000_000;

export interface InitialSeedInput {
  readonly timestamp: number;
  readonly anonymousAnalyticsId: string;
}

export interface InitialSchemaInputError {
  readonly kind: 'initial_schema_input_error';
  readonly code: 'INVALID_INITIAL_SEED_INPUT';
}

export type InitialSchemaApplyError =
  | InitialSchemaInputError
  | TransactionTechnicalError;

export interface InitialSchemaExecutor {
  executeStatic(sql: string): Promise<void>;
  run(sql: string, parameters: SQLiteParameters): Promise<SQLiteWriteResult>;
  getFirst<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow | null>;
  getAll<TRow>(sql: string, parameters: SQLiteParameters): Promise<TRow[]>;
}

const INITIAL_SCHEMA_TABLE_STATEMENTS = [
  `CREATE TABLE app_installation (
    id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
    installed_at INTEGER NOT NULL CHECK (
      typeof(installed_at) = 'integer'
      AND installed_at BETWEEN 0 AND 8640000000000000
    ),
    onboarding_completed_at INTEGER CHECK (
      onboarding_completed_at IS NULL
      OR (
        typeof(onboarding_completed_at) = 'integer'
        AND onboarding_completed_at BETWEEN 0 AND 8640000000000000
      )
    ),
    anonymous_analytics_id TEXT UNIQUE CHECK (
      anonymous_analytics_id IS NULL OR length(anonymous_analytics_id) > 0
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    )
  )`,
  `CREATE TABLE app_settings (
    id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
    focus_duration_minutes INTEGER NOT NULL DEFAULT 25 CHECK (
      typeof(focus_duration_minutes) = 'integer'
      AND focus_duration_minutes BETWEEN 15 AND 120
      AND focus_duration_minutes % 5 = 0
    ),
    short_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK (short_break_minutes = 5),
    long_break_minutes INTEGER NOT NULL DEFAULT 15 CHECK (long_break_minutes = 15),
    default_mode TEXT NOT NULL DEFAULT 'relax' CHECK (default_mode IN ('relax', 'strict')),
    sound_enabled INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1)),
    haptics_enabled INTEGER NOT NULL DEFAULT 1 CHECK (haptics_enabled IN (0, 1)),
    notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (notifications_enabled IN (0, 1)),
    analytics_enabled INTEGER NOT NULL DEFAULT 1 CHECK (analytics_enabled IN (0, 1)),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    )
  )`,
  `CREATE TABLE pet_profiles (
    id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (
      typeof(total_xp) = 'integer' AND total_xp >= 0
    ),
    coin_balance INTEGER NOT NULL DEFAULT 0 CHECK (
      typeof(coin_balance) = 'integer' AND coin_balance >= 0
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    )
  )`,
  `CREATE TABLE sessions (
    id TEXT NOT NULL PRIMARY KEY CHECK (length(id) > 0),
    profile_id INTEGER NOT NULL DEFAULT 1,
    session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'short_break', 'long_break')),
    focus_variant TEXT CHECK (focus_variant IS NULL OR focus_variant IN ('standard', 'onboarding_trial')),
    mode TEXT CHECK (mode IS NULL OR mode IN ('relax', 'strict')),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    work_tag TEXT CHECK (work_tag IS NULL OR work_tag IN ('coding', 'study', 'writing', 'reading')),
    configured_duration_minutes INTEGER NOT NULL CHECK (typeof(configured_duration_minutes) = 'integer'),
    started_at INTEGER NOT NULL CHECK (
      typeof(started_at) = 'integer'
      AND started_at BETWEEN 0 AND 8640000000000000
    ),
    ends_at INTEGER NOT NULL CHECK (
      typeof(ends_at) = 'integer'
      AND ends_at BETWEEN 0 AND 8640000000000000
    ),
    backgrounded_at INTEGER CHECK (
      backgrounded_at IS NULL
      OR (
        typeof(backgrounded_at) = 'integer'
        AND backgrounded_at BETWEEN 0 AND 8640000000000000
      )
    ),
    resolved_at INTEGER CHECK (
      resolved_at IS NULL
      OR (
        typeof(resolved_at) = 'integer'
        AND resolved_at BETWEEN 0 AND 8640000000000000
      )
    ),
    xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (typeof(xp_earned) = 'integer' AND xp_earned >= 0),
    coins_earned INTEGER NOT NULL DEFAULT 0 CHECK (typeof(coins_earned) = 'integer' AND coins_earned >= 0),
    reward_claimed_at INTEGER CHECK (
      reward_claimed_at IS NULL
      OR (
        typeof(reward_claimed_at) = 'integer'
        AND reward_claimed_at BETWEEN 0 AND 8640000000000000
      )
    ),
    scheduled_end_local_date TEXT NOT NULL CHECK (
      length(scheduled_end_local_date) = 10
      AND scheduled_end_local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    ),
    scheduled_end_utc_offset_minutes INTEGER NOT NULL CHECK (
      typeof(scheduled_end_utc_offset_minutes) = 'integer'
      AND scheduled_end_utc_offset_minutes BETWEEN -840 AND 840
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    ),
    UNIQUE (id, profile_id),
    FOREIGN KEY (profile_id) REFERENCES pet_profiles(id) ON DELETE RESTRICT,
    CHECK (ends_at = started_at + configured_duration_minutes * 60000),
    CHECK (
      (backgrounded_at IS NULL)
      OR (
        session_type = 'focus'
        AND focus_variant = 'standard'
        AND mode = 'strict'
      )
    ),
    CHECK (
      (
        session_type = 'focus'
        AND focus_variant = 'standard'
        AND mode IN ('relax', 'strict')
        AND work_tag IN ('coding', 'study', 'writing', 'reading')
        AND configured_duration_minutes BETWEEN 15 AND 120
        AND configured_duration_minutes % 5 = 0
      )
      OR (
        session_type = 'focus'
        AND focus_variant = 'onboarding_trial'
        AND mode = 'relax'
        AND work_tag IS NULL
        AND backgrounded_at IS NULL
        AND configured_duration_minutes = 5
        AND status IN ('running', 'completed', 'cancelled')
      )
      OR (
        session_type = 'short_break'
        AND focus_variant IS NULL
        AND mode IS NULL
        AND work_tag IS NULL
        AND backgrounded_at IS NULL
        AND configured_duration_minutes = 5
        AND status IN ('running', 'completed', 'cancelled')
      )
      OR (
        session_type = 'long_break'
        AND focus_variant IS NULL
        AND mode IS NULL
        AND work_tag IS NULL
        AND backgrounded_at IS NULL
        AND configured_duration_minutes = 15
        AND status IN ('running', 'completed', 'cancelled')
      )
    ),
    CHECK (
      (
        status = 'running'
        AND resolved_at IS NULL
        AND xp_earned = 0
        AND coins_earned = 0
        AND reward_claimed_at IS NULL
      )
      OR (
        status IN ('failed', 'cancelled')
        AND resolved_at IS NOT NULL
        AND xp_earned = 0
        AND coins_earned = 0
        AND reward_claimed_at IS NULL
      )
      OR (
        status = 'completed'
        AND session_type IN ('short_break', 'long_break')
        AND resolved_at IS NOT NULL
        AND xp_earned = 0
        AND coins_earned = 0
        AND reward_claimed_at IS NULL
      )
      OR (
        status = 'completed'
        AND session_type = 'focus'
        AND resolved_at IS NOT NULL
        AND xp_earned = configured_duration_minutes
        AND coins_earned = configured_duration_minutes / 5
        AND reward_claimed_at IS NOT NULL
      )
    )
  )`,
  `CREATE TABLE reward_transactions (
    id TEXT NOT NULL PRIMARY KEY CHECK (length(id) > 0),
    session_id TEXT NOT NULL UNIQUE,
    profile_id INTEGER NOT NULL DEFAULT 1,
    xp_delta INTEGER NOT NULL CHECK (typeof(xp_delta) = 'integer' AND xp_delta > 0),
    coin_delta INTEGER NOT NULL CHECK (typeof(coin_delta) = 'integer' AND coin_delta > 0),
    reason TEXT NOT NULL CHECK (reason IN ('focus_completed', 'onboarding_trial_completed')),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    FOREIGN KEY (profile_id) REFERENCES pet_profiles(id) ON DELETE RESTRICT,
    FOREIGN KEY (session_id, profile_id) REFERENCES sessions(id, profile_id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE catalog_items (
    id TEXT NOT NULL PRIMARY KEY CHECK (length(id) > 0),
    display_name TEXT NOT NULL CHECK (length(display_name) > 0),
    category TEXT NOT NULL DEFAULT 'furniture' CHECK (category = 'furniture'),
    price_coins INTEGER NOT NULL CHECK (typeof(price_coins) = 'integer' AND price_coins > 0),
    catalog_version INTEGER NOT NULL DEFAULT 1 CHECK (
      typeof(catalog_version) = 'integer' AND catalog_version > 0
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    )
  )`,
  `CREATE TABLE purchase_transactions (
    id TEXT NOT NULL PRIMARY KEY CHECK (length(id) > 0),
    profile_id INTEGER NOT NULL DEFAULT 1,
    item_id TEXT NOT NULL,
    price_paid_coins INTEGER NOT NULL CHECK (
      typeof(price_paid_coins) = 'integer' AND price_paid_coins > 0
    ),
    coin_delta INTEGER NOT NULL CHECK (
      typeof(coin_delta) = 'integer' AND coin_delta = -price_paid_coins
    ),
    reason TEXT NOT NULL DEFAULT 'item_purchase' CHECK (reason = 'item_purchase'),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    UNIQUE (profile_id, item_id),
    UNIQUE (id, profile_id, item_id),
    FOREIGN KEY (profile_id) REFERENCES pet_profiles(id) ON DELETE RESTRICT,
    FOREIGN KEY (item_id) REFERENCES catalog_items(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE owned_items (
    profile_id INTEGER NOT NULL DEFAULT 1,
    item_id TEXT NOT NULL,
    purchase_transaction_id TEXT NOT NULL UNIQUE,
    unlocked_at INTEGER NOT NULL CHECK (
      typeof(unlocked_at) = 'integer'
      AND unlocked_at BETWEEN 0 AND 8640000000000000
    ),
    is_equipped INTEGER NOT NULL DEFAULT 0 CHECK (is_equipped IN (0, 1)),
    equipped_at INTEGER CHECK (
      equipped_at IS NULL
      OR (
        typeof(equipped_at) = 'integer'
        AND equipped_at BETWEEN 0 AND 8640000000000000
      )
    ),
    updated_at INTEGER NOT NULL CHECK (
      typeof(updated_at) = 'integer'
      AND updated_at BETWEEN 0 AND 8640000000000000
    ),
    PRIMARY KEY (profile_id, item_id),
    FOREIGN KEY (profile_id) REFERENCES pet_profiles(id) ON DELETE RESTRICT,
    FOREIGN KEY (item_id) REFERENCES catalog_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (purchase_transaction_id, profile_id, item_id)
      REFERENCES purchase_transactions(id, profile_id, item_id)
      ON DELETE RESTRICT,
    CHECK (
      (is_equipped = 0 AND equipped_at IS NULL)
      OR (is_equipped = 1 AND equipped_at IS NOT NULL)
    )
  )`,
  `CREATE TABLE store_review_attempts (
    id TEXT NOT NULL PRIMARY KEY CHECK (length(id) > 0),
    app_version TEXT NOT NULL UNIQUE CHECK (length(app_version) > 0),
    attempted_at INTEGER NOT NULL CHECK (
      typeof(attempted_at) = 'integer'
      AND attempted_at BETWEEN 0 AND 8640000000000000
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    CHECK (created_at = attempted_at)
  )`,
  `CREATE TABLE analytics_events (
    event_id TEXT NOT NULL PRIMARY KEY CHECK (length(event_id) > 0),
    event_name TEXT NOT NULL CHECK (length(event_name) > 0),
    properties_json TEXT NOT NULL DEFAULT '{}' CHECK (
      json_valid(properties_json) = 1
      AND json_type(properties_json) = 'object'
      AND length(CAST(properties_json AS BLOB)) <= 2048
    ),
    occurred_at INTEGER NOT NULL CHECK (
      typeof(occurred_at) = 'integer'
      AND occurred_at BETWEEN 0 AND 8640000000000000
    ),
    expires_at INTEGER NOT NULL CHECK (
      typeof(expires_at) = 'integer'
      AND expires_at BETWEEN 0 AND 8640000000000000
    ),
    delivery_state TEXT NOT NULL DEFAULT 'pending' CHECK (
      delivery_state IN ('pending', 'retry_wait')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (
      typeof(attempt_count) = 'integer' AND attempt_count >= 0
    ),
    next_attempt_at INTEGER CHECK (
      next_attempt_at IS NULL
      OR (
        typeof(next_attempt_at) = 'integer'
        AND next_attempt_at BETWEEN 0 AND 8640000000000000
      )
    ),
    created_at INTEGER NOT NULL CHECK (
      typeof(created_at) = 'integer'
      AND created_at BETWEEN 0 AND 8640000000000000
    ),
    CHECK (expires_at = occurred_at + 604800000)
  )`,
  `CREATE TABLE schema_migrations (
    version INTEGER NOT NULL PRIMARY KEY CHECK (typeof(version) = 'integer' AND version > 0),
    name TEXT NOT NULL UNIQUE CHECK (length(name) > 0),
    checksum TEXT NOT NULL CHECK (length(checksum) > 0),
    applied_at INTEGER NOT NULL CHECK (
      typeof(applied_at) = 'integer'
      AND applied_at BETWEEN 0 AND 8640000000000000
    )
  )`,
] as const;

const INITIAL_SCHEMA_INDEX_STATEMENTS = [
  `CREATE UNIQUE INDEX ux_sessions_one_running
    ON sessions(status)
    WHERE status = 'running'`,
  `CREATE INDEX ix_sessions_history
    ON sessions(profile_id, session_type, focus_variant, status, ends_at DESC)`,
  `CREATE INDEX ix_sessions_local_day
    ON sessions(profile_id, scheduled_end_local_date, session_type, focus_variant, status)`,
  `CREATE INDEX ix_sessions_recent
    ON sessions(profile_id, started_at DESC)`,
  `CREATE INDEX ix_sessions_long_break_cadence
    ON sessions(profile_id, session_type, status, resolved_at DESC)`,
  `CREATE INDEX ix_sessions_strict_active
    ON sessions(backgrounded_at)
    WHERE status = 'running' AND mode = 'strict'`,
  `CREATE UNIQUE INDEX ux_reward_transactions_session
    ON reward_transactions(session_id)`,
  `CREATE INDEX ix_reward_transactions_profile_time
    ON reward_transactions(profile_id, created_at DESC)`,
  `CREATE INDEX ix_catalog_items_category_price
    ON catalog_items(category, price_coins, id)`,
  `CREATE UNIQUE INDEX ux_purchase_profile_item
    ON purchase_transactions(profile_id, item_id)`,
  `CREATE INDEX ix_owned_items_equipped
    ON owned_items(profile_id, is_equipped, updated_at DESC)`,
  `CREATE INDEX ix_store_review_attempt_time
    ON store_review_attempts(attempted_at DESC)`,
  `CREATE INDEX ix_analytics_delivery
    ON analytics_events(delivery_state, next_attempt_at, occurred_at)`,
  `CREATE INDEX ix_analytics_expiry
    ON analytics_events(expires_at)`,
] as const;

const INITIAL_SCHEMA_TRIGGER_STATEMENTS = [
  `CREATE TRIGGER trg_sessions_terminal_immutable
    BEFORE UPDATE OF status ON sessions
    WHEN OLD.status IN ('completed', 'failed', 'cancelled')
      AND NEW.status IS NOT OLD.status
    BEGIN
      SELECT RAISE(ABORT, 'sessions_terminal_immutable');
    END`,
  `CREATE TRIGGER trg_sessions_identity_immutable
    BEFORE UPDATE ON sessions
    WHEN NEW.id IS NOT OLD.id
      OR NEW.profile_id IS NOT OLD.profile_id
      OR NEW.session_type IS NOT OLD.session_type
      OR NEW.focus_variant IS NOT OLD.focus_variant
      OR NEW.mode IS NOT OLD.mode
      OR NEW.work_tag IS NOT OLD.work_tag
      OR NEW.configured_duration_minutes IS NOT OLD.configured_duration_minutes
      OR NEW.started_at IS NOT OLD.started_at
      OR NEW.ends_at IS NOT OLD.ends_at
      OR NEW.scheduled_end_local_date IS NOT OLD.scheduled_end_local_date
      OR NEW.scheduled_end_utc_offset_minutes IS NOT OLD.scheduled_end_utc_offset_minutes
    BEGIN
      SELECT RAISE(ABORT, 'sessions_identity_immutable');
    END`,
  `CREATE TRIGGER trg_reward_insert_valid_session
    BEFORE INSERT ON reward_transactions
    WHEN NOT EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = NEW.session_id
        AND sessions.profile_id = NEW.profile_id
        AND sessions.session_type = 'focus'
        AND sessions.status = 'completed'
        AND sessions.xp_earned = NEW.xp_delta
        AND sessions.coins_earned = NEW.coin_delta
        AND sessions.reward_claimed_at = NEW.created_at
        AND (
          (
            sessions.focus_variant = 'standard'
            AND NEW.reason = 'focus_completed'
          )
          OR (
            sessions.focus_variant = 'onboarding_trial'
            AND NEW.reason = 'onboarding_trial_completed'
          )
        )
    )
    BEGIN
      SELECT RAISE(ABORT, 'reward_session_mismatch');
    END`,
  `CREATE TRIGGER trg_reward_immutable
    BEFORE UPDATE ON reward_transactions
    BEGIN
      SELECT RAISE(ABORT, 'reward_immutable');
    END`,
  `CREATE TRIGGER trg_purchase_immutable
    BEFORE UPDATE ON purchase_transactions
    BEGIN
      SELECT RAISE(ABORT, 'purchase_immutable');
    END`,
  `CREATE TRIGGER trg_owned_item_equip_consistency
    BEFORE UPDATE OF is_equipped, equipped_at ON owned_items
    WHEN NOT (
      (NEW.is_equipped = 0 AND NEW.equipped_at IS NULL)
      OR (NEW.is_equipped = 1 AND NEW.equipped_at IS NOT NULL)
    )
    BEGIN
      SELECT RAISE(ABORT, 'owned_item_equip_mismatch');
    END`,
] as const;

const SCHEMA_PRECONDITION_SQL = `SELECT COUNT(*) AS count
  FROM sqlite_master
  WHERE name NOT LIKE 'sqlite_%'`;

const SCHEMA_TABLES_SQL = `SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name`;

const SEED_COUNTS_SQL = `SELECT
  (SELECT COUNT(*) FROM app_installation) AS installation_count,
  (SELECT COUNT(*) FROM app_settings) AS settings_count,
  (SELECT COUNT(*) FROM pet_profiles) AS profile_count,
  (SELECT COUNT(*) FROM catalog_items) AS catalog_count,
  (SELECT COUNT(*) FROM sessions) AS session_count,
  (SELECT COUNT(*) FROM reward_transactions) AS reward_count,
  (SELECT COUNT(*) FROM purchase_transactions) AS purchase_count,
  (SELECT COUNT(*) FROM owned_items) AS owned_count,
  (SELECT COUNT(*) FROM store_review_attempts) AS review_count,
  (SELECT COUNT(*) FROM analytics_events) AS analytics_count,
  (SELECT COUNT(*) FROM schema_migrations) AS migration_count`;

interface NameRow {
  readonly name: string;
}

interface CountRow {
  readonly count: number;
}

interface SeedCountsRow {
  readonly installation_count: number;
  readonly settings_count: number;
  readonly profile_count: number;
  readonly catalog_count: number;
  readonly session_count: number;
  readonly reward_count: number;
  readonly purchase_count: number;
  readonly owned_count: number;
  readonly review_count: number;
  readonly analytics_count: number;
  readonly migration_count: number;
}

const invalidSeedInput = (): InitialSchemaInputError => ({
  kind: 'initial_schema_input_error',
  code: 'INVALID_INITIAL_SEED_INPUT',
});

const isValidSeedInput = (input: InitialSeedInput): boolean =>
  Number.isSafeInteger(input.timestamp) &&
  input.timestamp >= 0 &&
  input.timestamp <= MAX_TIMESTAMP &&
  input.anonymousAnalyticsId.trim().length > 0;

const arraysEqual = <TValue>(
  actual: readonly TValue[],
  expected: readonly TValue[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

const assertEmptyDatabase = async (executor: InitialSchemaExecutor): Promise<void> => {
  const existingTables = await executor.getFirst<CountRow>(SCHEMA_PRECONDITION_SQL, []);
  if (existingTables === null || existingTables.count !== 0) {
    throw new Error('initial_schema_requires_empty_database');
  }
};

const seedInitialData = async (
  executor: InitialSchemaExecutor,
  input: InitialSeedInput,
): Promise<void> => {
  await executor.run(
    `INSERT INTO app_installation (
      id,
      installed_at,
      onboarding_completed_at,
      anonymous_analytics_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, input.timestamp, null, input.anonymousAnalyticsId, input.timestamp, input.timestamp],
  );
  await executor.run(
    `INSERT INTO app_settings (
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, 25, 5, 15, 'relax', 1, 1, 1, 1, input.timestamp, input.timestamp],
  );
  await executor.run(
    `INSERT INTO pet_profiles (
      id,
      total_xp,
      coin_balance,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [1, 0, 0, input.timestamp, input.timestamp],
  );

  for (const item of INITIAL_CATALOG_SEED) {
    await executor.run(
      `INSERT INTO catalog_items (
        id,
        display_name,
        category,
        price_coins,
        catalog_version,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.displayName,
        item.category,
        item.priceCoins,
        INITIAL_SCHEMA_VERSION,
        input.timestamp,
        input.timestamp,
      ],
    );
  }
};

const verifyInitialSchema = async (executor: InitialSchemaExecutor): Promise<void> => {
  const tableRows = await executor.getAll<NameRow>(SCHEMA_TABLES_SQL, []);
  if (!arraysEqual(tableRows.map(({ name }) => name), INITIAL_SCHEMA_TABLES)) {
    throw new Error('initial_schema_table_verification_failed');
  }

  const foreignKeyViolations = await executor.getAll<unknown>(
    'PRAGMA foreign_key_check',
    [],
  );
  if (foreignKeyViolations.length > 0) {
    throw new Error('initial_schema_foreign_key_verification_failed');
  }

  const counts = await executor.getFirst<SeedCountsRow>(SEED_COUNTS_SQL, []);
  if (
    counts === null ||
    counts.installation_count !== 1 ||
    counts.settings_count !== 1 ||
    counts.profile_count !== 1 ||
    counts.catalog_count !== INITIAL_CATALOG_SEED.length ||
    counts.session_count !== 0 ||
    counts.reward_count !== 0 ||
    counts.purchase_count !== 0 ||
    counts.owned_count !== 0 ||
    counts.review_count !== 0 ||
    counts.analytics_count !== 0 ||
    counts.migration_count !== 0
  ) {
    throw new Error('initial_schema_seed_verification_failed');
  }
};

export const initialSchemaMigration = {
  version: INITIAL_SCHEMA_VERSION,
  name: INITIAL_SCHEMA_NAME,
  schemaStatements: [
    ...INITIAL_SCHEMA_TABLE_STATEMENTS,
    ...INITIAL_SCHEMA_INDEX_STATEMENTS,
    ...INITIAL_SCHEMA_TRIGGER_STATEMENTS,
  ],
  async apply(executor: InitialSchemaExecutor, input: InitialSeedInput): Promise<void> {
    await assertEmptyDatabase(executor);

    for (const statement of this.schemaStatements) {
      await executor.executeStatic(statement);
    }

    await seedInitialData(executor, input);
    await verifyInitialSchema(executor);
  },
} as const;

export const applyInitialSchema = async (
  transaction: SQLiteTransaction,
  input: InitialSeedInput,
): Promise<ApplicationResult<void, InitialSchemaApplyError>> => {
  if (!isValidSeedInput(input)) {
    return { ok: false, error: invalidSeedInput() };
  }

  return transaction.execute(async (scope) => {
    await initialSchemaMigration.apply(transaction.executorFor(scope), input);
    return { ok: true as const, value: undefined };
  });
};

export const initialSchemaVerificationSql = {
  emptyDatabase: SCHEMA_PRECONDITION_SQL,
  schemaTables: SCHEMA_TABLES_SQL,
  seedCounts: SEED_COUNTS_SQL,
} as const;
