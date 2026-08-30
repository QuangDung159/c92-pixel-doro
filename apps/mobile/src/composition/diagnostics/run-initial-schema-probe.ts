import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  applyInitialSchema,
  initialSchemaMigration,
  type InitialSchemaExecutor,
  type InitialSeedInput,
} from "@/infrastructure/database/migrations/001_initial-schema.migration";
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_COLUMN_MANIFEST,
  INITIAL_SCHEMA_FOREIGN_KEYS,
  INITIAL_SCHEMA_INDEXES,
  INITIAL_SCHEMA_TABLES,
  INITIAL_SCHEMA_TRIGGERS,
} from "@/infrastructure/database/migrations/schema-manifest";
import { SQLiteDatabaseOwner } from "@/infrastructure/database/sqlite-database-owner";
import type {
  SQLiteDriver,
  SQLiteParameters,
} from "@/infrastructure/database/sqlite-driver";
import { SQLiteTransaction } from "@/infrastructure/database/sqlite-transaction";

const PROBE_DATABASE_NAME = "pixeldoro-us-02-02-schema-probe.db";
const FAILURE_DATABASE_NAME = "pixeldoro-us-02-02-failure-probe.db";
const SEED_TIMESTAMP = 1_787_836_800_000;
const ANALYTICS_ID = `schema-probe'); DROP TABLE sessions;--`;

const INSERT_SESSION_SQL = `INSERT INTO sessions (
  id,
  profile_id,
  session_type,
  focus_variant,
  mode,
  status,
  work_tag,
  configured_duration_minutes,
  started_at,
  ends_at,
  backgrounded_at,
  resolved_at,
  xp_earned,
  coins_earned,
  reward_claimed_at,
  scheduled_end_local_date,
  scheduled_end_utc_offset_minutes,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export interface InitialSchemaProbeReport {
  readonly probe: "US-02-02_INITIAL_SCHEMA";
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly commitSha: string;
  readonly assertions: readonly string[];
}

interface NameRow {
  readonly name: string;
  readonly sql?: string | null;
}

interface TableInfoRow {
  readonly name: string;
  readonly type: string;
  readonly notnull: number;
  readonly dflt_value: string | null;
  readonly pk: number;
}

interface ForeignKeyRow {
  readonly table: string;
  readonly from: string;
  readonly to: string;
  readonly on_delete: string;
}

interface IndexRow extends NameRow {
  readonly tbl_name: string;
  readonly sql: string | null;
}

interface IndexInfoRow {
  readonly name: string | null;
  readonly desc: number;
  readonly key: number;
}

interface InstallationRow {
  readonly id: number;
  readonly installed_at: number;
  readonly onboarding_completed_at: number | null;
  readonly anonymous_analytics_id: string | null;
  readonly created_at: number;
  readonly updated_at: number;
}

interface SettingsRow {
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

interface ProfileRow {
  readonly id: number;
  readonly total_xp: number;
  readonly coin_balance: number;
  readonly created_at: number;
  readonly updated_at: number;
}

interface CatalogRow {
  readonly id: string;
  readonly display_name: string;
  readonly category: string;
  readonly price_coins: number;
  readonly catalog_version: number;
  readonly created_at: number;
  readonly updated_at: number;
}

interface CountRow {
  readonly count: number;
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  passedAssertions: string[],
): void => {
  if (!condition) {
    throw new Error(assertion);
  }
  passedAssertions.push(assertion);
};

const arraysEqual = <TValue>(
  actual: readonly TValue[],
  expected: readonly TValue[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

const normalizeSql = (sql: string): string =>
  sql.replace(/\s+/g, " ").trim().toLowerCase();

const trustedIdentifier = (identifier: string): string => {
  if (!/^[a-z0-9_]+$/.test(identifier)) {
    throw new Error("untrusted_schema_identifier");
  }
  return `"${identifier}"`;
};

const read = async <TValue>(
  transaction: SQLiteTransaction,
  work: (executor: InitialSchemaExecutor) => Promise<TValue>,
): Promise<TValue> => {
  const result = await transaction.execute(async (scope) => ({
    ok: true as const,
    value: await work(transaction.executorFor(scope)),
  }));
  if (!result.ok) {
    throw new Error("schema_probe_read_failed");
  }
  return result.value;
};

const expectRejected = async (
  transaction: SQLiteTransaction,
  sql: string,
  parameters: SQLiteParameters,
): Promise<boolean> => {
  const result = await transaction.execute(async (scope) => {
    await transaction.executorFor(scope).run(sql, parameters);
    return { ok: true as const, value: undefined };
  });
  return !result.ok;
};

const inspectSchema = async (
  transaction: SQLiteTransaction,
): Promise<boolean> =>
  read(transaction, async (executor) => {
    const tables = await executor.getAll<NameRow>(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
      [],
    );
    if (
      !arraysEqual(
        tables.map(({ name }) => name),
        INITIAL_SCHEMA_TABLES,
      )
    ) {
      return false;
    }

    for (const table of INITIAL_SCHEMA_TABLES) {
      const columns = await executor.getAll<TableInfoRow>(
        `PRAGMA table_info(${trustedIdentifier(table)})`,
        [],
      );
      const expectedColumns = INITIAL_SCHEMA_COLUMN_MANIFEST[table];
      if (
        !arraysEqual(
          columns.map(({ name }) => name),
          expectedColumns.map(({ name }) => name),
        ) ||
        columns.some((actual, index) => {
          const expected = expectedColumns[index];
          return (
            expected === undefined ||
            actual.type.toUpperCase() !== expected.type ||
            actual.notnull !== (expected.notNull ? 1 : 0) ||
            actual.dflt_value !== expected.defaultValue ||
            actual.pk !== expected.primaryKeyPosition
          );
        })
      ) {
        return false;
      }
    }

    const indexes = await executor.getAll<IndexRow>(
      `SELECT name, tbl_name, sql
       FROM sqlite_master
       WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex_%'
       ORDER BY name`,
      [],
    );
    const expectedIndexNames = INITIAL_SCHEMA_INDEXES.map(
      ({ name }) => name,
    ).sort();
    if (
      !arraysEqual(
        indexes.map(({ name }) => name),
        expectedIndexNames,
      )
    ) {
      return false;
    }

    for (const expected of INITIAL_SCHEMA_INDEXES) {
      const index = indexes.find(({ name }) => name === expected.name);
      const indexColumns = await executor.getAll<IndexInfoRow>(
        `PRAGMA index_xinfo(${trustedIdentifier(expected.name)})`,
        [],
      );
      const keyColumns = indexColumns.filter(
        ({ key, name }) => key === 1 && name !== null,
      );
      if (
        !arraysEqual(
          keyColumns.map(({ name }) => name),
          expected.columns,
        )
      ) {
        return false;
      }
      if (
        keyColumns.some(
          ({ name, desc }) =>
            desc !==
            (expected.descending?.includes(name ?? "") === true ? 1 : 0),
        )
      ) {
        return false;
      }
      if (index?.sql == null || index.tbl_name !== expected.table) {
        return false;
      }
      const normalizedIndexSql = normalizeSql(index.sql);
      if (
        normalizedIndexSql.startsWith("create unique index") !==
          expected.unique ||
        (expected.where === undefined
          ? normalizedIndexSql.includes(" where ")
          : !normalizedIndexSql.includes(
              `where ${normalizeSql(expected.where)}`,
            ))
      ) {
        return false;
      }
    }

    const triggers = await executor.getAll<NameRow>(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'trigger'
       ORDER BY name`,
      [],
    );
    if (
      !arraysEqual(
        triggers.map(({ name }) => name),
        INITIAL_SCHEMA_TRIGGERS,
      )
    ) {
      return false;
    }

    return true;
  });

const inspectForeignKeys = async (
  transaction: SQLiteTransaction,
): Promise<boolean> =>
  read(transaction, async (executor) => {
    const foreignKeys: (ForeignKeyRow & { readonly sourceTable: string })[] =
      [];
    for (const table of INITIAL_SCHEMA_TABLES) {
      const rows = await executor.getAll<ForeignKeyRow>(
        `PRAGMA foreign_key_list(${trustedIdentifier(table)})`,
        [],
      );
      foreignKeys.push(...rows.map((row) => ({ ...row, sourceTable: table })));
    }
    const violations = await executor.getAll<unknown>(
      "PRAGMA foreign_key_check",
      [],
    );
    const actualSurface = foreignKeys
      .map(
        ({ sourceTable, from, table, to, on_delete: onDelete }) =>
          `${sourceTable}:${from}:${table}:${to}:${onDelete.toUpperCase()}`,
      )
      .sort();
    const expectedSurface = INITIAL_SCHEMA_FOREIGN_KEYS.map(
      ({ table, from, targetTable, targetColumn }) =>
        `${table}:${from}:${targetTable}:${targetColumn}:RESTRICT`,
    ).sort();
    return (
      arraysEqual(actualSurface, expectedSurface) && violations.length === 0
    );
  });

const inspectExactSeed = async (
  transaction: SQLiteTransaction,
): Promise<boolean> =>
  read(transaction, async (executor) => {
    const installation = await executor.getFirst<InstallationRow>(
      "SELECT * FROM app_installation WHERE id = ?",
      [1],
    );
    const settings = await executor.getFirst<SettingsRow>(
      "SELECT * FROM app_settings WHERE id = ?",
      [1],
    );
    const profile = await executor.getFirst<ProfileRow>(
      "SELECT * FROM pet_profiles WHERE id = ?",
      [1],
    );
    const catalog = await executor.getAll<CatalogRow>(
      "SELECT * FROM catalog_items ORDER BY id",
      [],
    );
    const emptyCounts = await executor.getFirst<{
      readonly sessions: number;
      readonly rewards: number;
      readonly purchases: number;
      readonly owned: number;
      readonly reviews: number;
      readonly analytics: number;
      readonly migrations: number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM sessions) AS sessions,
        (SELECT COUNT(*) FROM reward_transactions) AS rewards,
        (SELECT COUNT(*) FROM purchase_transactions) AS purchases,
        (SELECT COUNT(*) FROM owned_items) AS owned,
        (SELECT COUNT(*) FROM store_review_attempts) AS reviews,
        (SELECT COUNT(*) FROM analytics_events) AS analytics,
        (SELECT COUNT(*) FROM schema_migrations) AS migrations`,
      [],
    );

    const expectedCatalog = [...INITIAL_CATALOG_SEED]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((item) => ({
        id: item.id,
        display_name: item.displayName,
        category: item.category,
        price_coins: item.priceCoins,
        catalog_version: 1,
        created_at: SEED_TIMESTAMP,
        updated_at: SEED_TIMESTAMP,
      }));

    return (
      JSON.stringify(installation) ===
        JSON.stringify({
          id: 1,
          installed_at: SEED_TIMESTAMP,
          onboarding_completed_at: null,
          anonymous_analytics_id: ANALYTICS_ID,
          created_at: SEED_TIMESTAMP,
          updated_at: SEED_TIMESTAMP,
        }) &&
      JSON.stringify(settings) ===
        JSON.stringify({
          id: 1,
          focus_duration_minutes: 25,
          short_break_minutes: 5,
          long_break_minutes: 15,
          default_mode: "relax",
          sound_enabled: 1,
          haptics_enabled: 1,
          notifications_enabled: 1,
          analytics_enabled: 1,
          created_at: SEED_TIMESTAMP,
          updated_at: SEED_TIMESTAMP,
        }) &&
      JSON.stringify(profile) ===
        JSON.stringify({
          id: 1,
          total_xp: 0,
          coin_balance: 0,
          created_at: SEED_TIMESTAMP,
          updated_at: SEED_TIMESTAMP,
        }) &&
      JSON.stringify(catalog) === JSON.stringify(expectedCatalog) &&
      emptyCounts !== null &&
      Object.values(emptyCounts).every((count) => count === 0)
    );
  });

const insertValidFixtures = async (
  transaction: SQLiteTransaction,
): Promise<boolean> => {
  const t = SEED_TIMESTAMP + 10_000_000;
  const result = await transaction.execute(async (scope) => {
    const executor = transaction.executorFor(scope);
    await executor.run(INSERT_SESSION_SQL, [
      "session-standard-completed",
      1,
      "focus",
      "standard",
      "relax",
      "completed",
      "coding",
      25,
      t,
      t + 1_500_000,
      null,
      t + 1_500_000,
      25,
      5,
      t + 1_500_000,
      "2026-08-28",
      420,
      t,
      t + 1_500_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-trial-completed",
      1,
      "focus",
      "onboarding_trial",
      "relax",
      "completed",
      null,
      5,
      t + 2_000_000,
      t + 2_300_000,
      null,
      t + 2_300_000,
      5,
      1,
      t + 2_300_000,
      "2026-08-28",
      420,
      t + 2_000_000,
      t + 2_300_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-short-break-completed",
      1,
      "short_break",
      null,
      null,
      "completed",
      null,
      5,
      t + 3_000_000,
      t + 3_300_000,
      null,
      t + 3_300_000,
      0,
      0,
      null,
      "2026-08-28",
      420,
      t + 3_000_000,
      t + 3_300_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-long-break-cancelled",
      1,
      "long_break",
      null,
      null,
      "cancelled",
      null,
      15,
      t + 4_000_000,
      t + 4_900_000,
      null,
      t + 4_100_000,
      0,
      0,
      null,
      "2026-08-28",
      420,
      t + 4_000_000,
      t + 4_100_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-standard-failed",
      1,
      "focus",
      "standard",
      "strict",
      "failed",
      "reading",
      30,
      t + 5_000_000,
      t + 6_800_000,
      t + 5_100_000,
      t + 5_200_000,
      0,
      0,
      null,
      "2026-08-28",
      420,
      t + 5_000_000,
      t + 5_200_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-standard-cancelled",
      1,
      "focus",
      "standard",
      "relax",
      "cancelled",
      "writing",
      20,
      t + 7_000_000,
      t + 8_200_000,
      null,
      t + 7_100_000,
      0,
      0,
      null,
      "2026-08-28",
      420,
      t + 7_000_000,
      t + 7_100_000,
    ]);
    await executor.run(INSERT_SESSION_SQL, [
      "session-strict-running",
      1,
      "focus",
      "standard",
      "strict",
      "running",
      "study",
      50,
      t + 9_000_000,
      t + 12_000_000,
      t + 9_100_000,
      null,
      0,
      0,
      null,
      "2026-08-28",
      420,
      t + 9_000_000,
      t + 9_100_000,
    ]);
    await executor.run(
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-standard",
        "session-standard-completed",
        1,
        25,
        5,
        "focus_completed",
        t + 1_500_000,
      ],
    );
    await executor.run(
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-trial",
        "session-trial-completed",
        1,
        5,
        1,
        "onboarding_trial_completed",
        t + 2_300_000,
      ],
    );
    await executor.run(
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "purchase-desk-mug",
        1,
        "desk-mug",
        5,
        -5,
        "item_purchase",
        t + 6_000_000,
      ],
    );
    await executor.run(
      `INSERT INTO owned_items (
        profile_id, item_id, purchase_transaction_id, unlocked_at,
        is_equipped, equipped_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        "desk-mug",
        "purchase-desk-mug",
        t + 6_000_000,
        0,
        null,
        t + 6_000_000,
      ],
    );
    await executor.run(
      `INSERT INTO store_review_attempts (
        id, app_version, attempted_at, created_at
      ) VALUES (?, ?, ?, ?)`,
      ["review-attempt", "0.1.0-probe", t + 7_000_000, t + 7_000_000],
    );
    await executor.run(
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "analytics-event",
        "probe_event",
        "{}",
        t + 8_000_000,
        t + 8_000_000 + 604_800_000,
        "pending",
        0,
        null,
        t + 8_000_000,
      ],
    );
    await executor.run(
      "UPDATE pet_profiles SET total_xp = ?, coin_balance = ?, updated_at = ? WHERE id = ?",
      [30, 1, t + 6_000_000, 1],
    );
    return { ok: true as const, value: undefined };
  });
  return result.ok;
};

const runNegativeMatrix = async (
  transaction: SQLiteTransaction,
): Promise<boolean> => {
  const t = SEED_TIMESTAMP + 30_000_000;
  const before = await read(transaction, async (executor) => {
    const durableRows: Record<string, readonly unknown[]> = {};
    for (const table of INITIAL_SCHEMA_TABLES) {
      durableRows[table] = await executor.getAll<unknown>(
        `SELECT * FROM ${trustedIdentifier(table)} ORDER BY rowid`,
        [],
      );
    }
    return JSON.stringify(durableRows);
  });
  const cases: readonly [string, SQLiteParameters][] = [
    [
      `INSERT INTO app_settings (
        id, focus_duration_minutes, short_break_minutes, long_break_minutes,
        default_mode, sound_enabled, haptics_enabled, notifications_enabled,
        analytics_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [2, 25, 5, 15, "relax", 1, 1, 1, 1, t, t],
    ],
    [
      "UPDATE app_settings SET focus_duration_minutes = ? WHERE id = ?",
      [16, 1],
    ],
    ["UPDATE app_settings SET sound_enabled = ? WHERE id = ?", [2, 1]],
    ["UPDATE app_settings SET default_mode = ? WHERE id = ?", ["balanced", 1]],
    ["UPDATE pet_profiles SET total_xp = ? WHERE id = ?", [-1, 1]],
    ["UPDATE pet_profiles SET updated_at = ? WHERE id = ?", [-1, 1]],
    [
      INSERT_SESSION_SQL,
      [
        "unknown-status",
        1,
        "focus",
        "standard",
        "relax",
        "paused",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        null,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "unknown-type",
        1,
        "deep_work",
        null,
        null,
        "cancelled",
        null,
        5,
        t,
        t + 300_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "unknown-mode",
        1,
        "focus",
        "standard",
        "balanced",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "unknown-tag",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "gaming",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "invalid-standard-duration",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        17,
        t,
        t + 1_020_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "invalid-trial",
        1,
        "focus",
        "onboarding_trial",
        "strict",
        "failed",
        null,
        5,
        t,
        t + 300_000,
        t + 1,
        t + 2,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 2,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "trial-failed",
        1,
        "focus",
        "onboarding_trial",
        "relax",
        "failed",
        null,
        5,
        t,
        t + 300_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "invalid-break",
        1,
        "short_break",
        null,
        "relax",
        "completed",
        null,
        5,
        t,
        t + 300_000,
        null,
        t + 300_000,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 300_000,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "break-failed",
        1,
        "short_break",
        null,
        null,
        "failed",
        null,
        5,
        t,
        t + 300_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "running-with-terminal-fields",
        1,
        "focus",
        "standard",
        "relax",
        "running",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "terminal-without-resolved-at",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        null,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "completed-focus-bad-reward",
        1,
        "focus",
        "standard",
        "relax",
        "completed",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1_500_000,
        20,
        4,
        t + 1_500_000,
        "2026-08-28",
        420,
        t,
        t + 1_500_000,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "bad-end-arithmetic",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_499_999,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "bad-local-date",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "28-08-2026",
        420,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "bad-offset",
        1,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        841,
        t,
        t + 1,
      ],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "second-running",
        1,
        "focus",
        "standard",
        "relax",
        "running",
        "writing",
        25,
        t,
        t + 1_500_000,
        null,
        null,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t,
      ],
    ],
    [
      "UPDATE sessions SET status = ? WHERE id = ?",
      ["cancelled", "session-standard-completed"],
    ],
    [
      "UPDATE sessions SET work_tag = ? WHERE id = ?",
      ["reading", "session-standard-completed"],
    ],
    [
      INSERT_SESSION_SQL,
      [
        "missing-profile",
        2,
        "focus",
        "standard",
        "relax",
        "cancelled",
        "coding",
        25,
        t,
        t + 1_500_000,
        null,
        t + 1,
        0,
        0,
        null,
        "2026-08-28",
        420,
        t,
        t + 1,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-missing-session",
        "missing-session",
        1,
        25,
        5,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-for-break",
        "session-short-break-completed",
        1,
        5,
        1,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-for-running",
        "session-strict-running",
        1,
        50,
        10,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-for-failed",
        "session-standard-failed",
        1,
        30,
        6,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-for-cancelled",
        "session-standard-cancelled",
        1,
        20,
        4,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-mismatch",
        "session-standard-completed",
        1,
        20,
        4,
        "focus_completed",
        t,
      ],
    ],
    [
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-missing-item", 1, "missing-item", 5, -5, "item_purchase", t],
    ],
    [
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-invalid-reason", 1, "tiny-plant", 10, -10, "refund", t],
    ],
    [
      `INSERT INTO reward_transactions (
        id, session_id, profile_id, xp_delta, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "reward-duplicate",
        "session-standard-completed",
        1,
        25,
        5,
        "focus_completed",
        t,
      ],
    ],
    [
      "UPDATE reward_transactions SET xp_delta = ? WHERE id = ?",
      [30, "reward-standard"],
    ],
    [
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-invalid-delta", 1, "tiny-plant", 10, -9, "item_purchase", t],
    ],
    [
      `INSERT INTO purchase_transactions (
        id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-duplicate", 1, "desk-mug", 5, -5, "item_purchase", t],
    ],
    [
      "UPDATE purchase_transactions SET price_paid_coins = ? WHERE id = ?",
      [6, "purchase-desk-mug"],
    ],
    [
      `INSERT INTO owned_items (
        profile_id, item_id, purchase_transaction_id, unlocked_at,
        is_equipped, equipped_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [1, "tiny-plant", "purchase-desk-mug", t, 0, null, t],
    ],
    [
      "UPDATE owned_items SET is_equipped = ?, equipped_at = ? WHERE profile_id = ? AND item_id = ?",
      [1, null, 1, "desk-mug"],
    ],
    [
      `INSERT INTO owned_items (
        profile_id, item_id, purchase_transaction_id, unlocked_at,
        is_equipped, equipped_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [1, "desk-mug", "purchase-desk-mug", t, 0, null, t],
    ],
    [
      `INSERT INTO store_review_attempts (
        id, app_version, attempted_at, created_at
      ) VALUES (?, ?, ?, ?)`,
      ["duplicate-review", "0.1.0-probe", t, t],
    ],
    [
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "oversized-analytics",
        "probe_event",
        "x".repeat(2049),
        t,
        t + 604_800_000,
        "pending",
        0,
        null,
        t,
      ],
    ],
    [
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "invalid-json-analytics",
        "probe_event",
        "{not-json}",
        t,
        t + 604_800_000,
        "pending",
        0,
        null,
        t,
      ],
    ],
    [
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "analytics-bad-state",
        "probe_event",
        "{}",
        t,
        t + 604_800_000,
        "sent",
        0,
        null,
        t,
      ],
    ],
    [
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "analytics-bad-count",
        "probe_event",
        "{}",
        t,
        t + 604_800_000,
        "pending",
        -1,
        null,
        t,
      ],
    ],
    [
      `INSERT INTO analytics_events (
        event_id, event_name, properties_json, occurred_at, expires_at,
        delivery_state, attempt_count, next_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "analytics-bad-expiry",
        "probe_event",
        "{}",
        t,
        t + 1,
        "pending",
        0,
        null,
        t,
      ],
    ],
    ["DELETE FROM pet_profiles WHERE id = ?", [1]],
  ];

  for (const [sql, parameters] of cases) {
    if (!(await expectRejected(transaction, sql, parameters))) {
      return false;
    }
  }

  const after = await read(transaction, async (executor) => {
    const durableRows: Record<string, readonly unknown[]> = {};
    for (const table of INITIAL_SCHEMA_TABLES) {
      durableRows[table] = await executor.getAll<unknown>(
        `SELECT * FROM ${trustedIdentifier(table)} ORDER BY rowid`,
        [],
      );
    }
    return JSON.stringify(durableRows);
  });

  return before === after;
};

const verifyFailureRollback = async (
  transaction: SQLiteTransaction,
  input: InitialSeedInput,
): Promise<boolean> => {
  const result = await transaction.execute(async (scope) => {
    const executor = transaction.executorFor(scope);
    let executedStatements = 0;
    const failingExecutor: InitialSchemaExecutor = {
      executeStatic: async (sql) => {
        await executor.executeStatic(sql);
        executedStatements += 1;
        if (executedStatements === 4) {
          throw new Error("injected_initial_schema_failure");
        }
      },
      run: (sql, parameters) => executor.run(sql, parameters),
      getFirst: <TRow>(sql: string, parameters: SQLiteParameters) =>
        executor.getFirst<TRow>(sql, parameters),
      getAll: <TRow>(sql: string, parameters: SQLiteParameters) =>
        executor.getAll<TRow>(sql, parameters),
    };
    await initialSchemaMigration.apply(failingExecutor, input);
    return { ok: true as const, value: undefined };
  });
  if (result.ok) {
    return false;
  }

  return read(transaction, async (executor) => {
    const row = await executor.getFirst<CountRow>(
      `SELECT COUNT(*) AS count
       FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
      [],
    );
    return row?.count === 0;
  });
};

const removeStaleProbeDatabase = async (
  driver: SQLiteDriver,
  databaseName: string,
): Promise<void> => {
  try {
    await driver.deleteDatabase(databaseName);
  } catch {
    // A missing stale probe database is an acceptable clean starting state.
  }
};

export const runInitialSchemaProbe = async (
  driver: SQLiteDriver,
): Promise<InitialSchemaProbeReport> => {
  const assertions: string[] = [];
  const seedInput = {
    timestamp: SEED_TIMESTAMP,
    anonymousAnalyticsId: ANALYTICS_ID,
  } satisfies InitialSeedInput;
  const owner = new SQLiteDatabaseOwner(PROBE_DATABASE_NAME, driver);
  const transaction = new SQLiteTransaction(owner);
  const failureOwner = new SQLiteDatabaseOwner(FAILURE_DATABASE_NAME, driver);
  const failureTransaction = new SQLiteTransaction(failureOwner);
  let failedAssertion: string | undefined;
  let mainSafeToDelete = false;
  let failureSafeToDelete = false;

  try {
    await removeStaleProbeDatabase(driver, PROBE_DATABASE_NAME);
    await removeStaleProbeDatabase(driver, FAILURE_DATABASE_NAME);

    const openResult = await owner.open();
    assertProbe(openResult.ok, "schema_probe_database_opened", assertions);

    const applyResult = await applyInitialSchema(transaction, seedInput);
    assertProbe(
      applyResult.ok,
      "initial_schema_applied_atomically",
      assertions,
    );
    assertProbe(
      await inspectSchema(transaction),
      "exact_schema_surface_verified",
      assertions,
    );
    assertProbe(
      await inspectForeignKeys(transaction),
      "foreign_keys_restrict_and_valid_seed_verified",
      assertions,
    );
    assertProbe(
      await inspectExactSeed(transaction),
      "exact_seed_verified",
      assertions,
    );
    assertProbe(
      await insertValidFixtures(transaction),
      "valid_entity_shapes_committed",
      assertions,
    );
    assertProbe(
      await runNegativeMatrix(transaction),
      "negative_write_matrix_rejected_without_partial_rows",
      assertions,
    );

    const closeResult = await owner.close();
    const reopenResult = await owner.open();
    assertProbe(
      closeResult.ok && reopenResult.ok && (await inspectSchema(transaction)),
      "schema_and_seed_survived_reopen",
      assertions,
    );

    const failureOpen = await failureOwner.open();
    assertProbe(failureOpen.ok, "failure_probe_database_opened", assertions);
    assertProbe(
      await verifyFailureRollback(failureTransaction, seedInput),
      "injected_apply_failure_rolled_back_all_schema",
      assertions,
    );

    const finalMainClose = await owner.close();
    const repeatedMainClose = await owner.close();
    const finalFailureClose = await failureOwner.close();
    assertProbe(
      finalMainClose.ok && repeatedMainClose.ok && finalFailureClose.ok,
      "probe_connections_closed_idempotently",
      assertions,
    );
    mainSafeToDelete = true;
    failureSafeToDelete = true;
  } catch (error) {
    failedAssertion =
      error instanceof Error ? error.message : "unknown_schema_probe_failure";
  } finally {
    const mainClose = await owner.close();
    const failureClose = await failureOwner.close();
    mainSafeToDelete = mainSafeToDelete || mainClose.ok;
    failureSafeToDelete = failureSafeToDelete || failureClose.ok;

    if (mainSafeToDelete) {
      try {
        await driver.deleteDatabase(PROBE_DATABASE_NAME);
      } catch {
        failedAssertion ??= "schema_probe_database_cleanup_failed";
      }
    } else {
      failedAssertion ??= "schema_probe_database_not_closed";
    }

    if (failureSafeToDelete) {
      try {
        await driver.deleteDatabase(FAILURE_DATABASE_NAME);
      } catch {
        failedAssertion ??= "failure_probe_database_cleanup_failed";
      }
    } else {
      failedAssertion ??= "failure_probe_database_not_closed";
    }
  }

  return {
    probe: "US-02-02_INITIAL_SCHEMA",
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? "unknown",
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? "not-provided",
    assertions,
  };
};
