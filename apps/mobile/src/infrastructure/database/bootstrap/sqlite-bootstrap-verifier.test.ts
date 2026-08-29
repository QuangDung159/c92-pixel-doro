import { describe, expect, it } from 'vitest';

import { FakeSQLiteDriver } from '../../../../test/fakes/fake-sqlite-driver';
import { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import { migrationInspectionSql } from '../migration-runner';
import { initialSchemaMigration } from '../migrations/001_initial-schema.migration';
import { productionMigrationRegistry } from '../migrations/migration-registry';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_COLUMN_MANIFEST,
  INITIAL_SCHEMA_FOREIGN_KEYS,
  INITIAL_SCHEMA_TABLES,
} from '../migrations/schema-manifest';
import {
  bootstrapDataSql,
  SQLiteBootstrapDataAdapter,
} from './sqlite-bootstrap-data.adapter';
import {
  bootstrapVerificationSql,
  SQLiteBootstrapVerifier,
} from './sqlite-bootstrap-verifier';

const TIMESTAMP = 1_787_836_800_000;

const schemaObject = (sql: string) => {
  const match = /^CREATE\s+(?:UNIQUE\s+)?(TABLE|INDEX|TRIGGER)\s+([a-z0-9_]+)/i.exec(
    sql,
  );
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error('test_schema_statement_invalid');
  }
  const type = match[1].toLowerCase();
  const name = match[2];
  const ownerMatch = /\sON\s+([a-z0-9_]+)/i.exec(sql);
  return {
    type,
    name,
    tbl_name: type === 'table' ? name : ownerMatch?.[1],
    sql,
  };
};

const createHarness = async () => {
  const driver = new FakeSQLiteDriver();
  const owner = new SQLiteDatabaseOwner('bootstrap-verifier-test.db', driver);
  await owner.open();
  driver.connection.controlStatements.length = 0;
  driver.connection.boundStatements.length = 0;

  driver.connection.allRows.set(bootstrapVerificationSql.integrity, [
    { integrity_check: 'ok' },
  ]);
  driver.connection.allRows.set(bootstrapVerificationSql.foreignKeyCheck, []);
  driver.connection.allRows.set(
    bootstrapVerificationSql.schemaObjects,
    initialSchemaMigration.schemaStatements.map(schemaObject),
  );
  driver.connection.allRows.set(
    migrationInspectionSql.history,
    productionMigrationRegistry.map((migration) => ({
      version: migration.version,
      name: migration.name,
      checksum: migration.checksum,
      applied_at: TIMESTAMP,
    })),
  );
  driver.connection.firstRows.set(bootstrapVerificationSql.economy, {
    total_xp: 0,
    coin_balance: 0,
    reward_xp: 0,
    reward_coins: 0,
    purchase_coins: 0,
  });

  for (const table of INITIAL_SCHEMA_TABLES) {
    driver.connection.allRows.set(
      `PRAGMA table_info(${table})`,
      INITIAL_SCHEMA_COLUMN_MANIFEST[table].map((column, cid) => ({
        cid,
        name: column.name,
        type: column.type,
        notnull: column.notNull ? 1 : 0,
        dflt_value: column.defaultValue,
        pk: column.primaryKeyPosition,
      })),
    );
    driver.connection.allRows.set(
      `PRAGMA foreign_key_list(${table})`,
      INITIAL_SCHEMA_FOREIGN_KEYS.filter((row) => row.table === table).map(
        (row) => ({
          table: row.targetTable,
          from: row.from,
          to: row.targetColumn,
          on_delete: 'RESTRICT',
        }),
      ),
    );
  }

  driver.connection.allRows.set(bootstrapDataSql.migrationHistory, [
    { version: 1 },
  ]);
  driver.connection.allRows.set(bootstrapDataSql.installation, [
    {
      id: 1,
      installed_at: TIMESTAMP,
      onboarding_completed_at: null,
      anonymous_analytics_id: 'installation-id',
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  ]);
  driver.connection.allRows.set(bootstrapDataSql.settings, [
    {
      id: 1,
      focus_duration_minutes: 25,
      short_break_minutes: 5,
      long_break_minutes: 15,
      default_mode: 'relax',
      sound_enabled: 1,
      haptics_enabled: 1,
      notifications_enabled: 1,
      analytics_enabled: 1,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  ]);
  driver.connection.allRows.set(bootstrapDataSql.profile, [
    {
      id: 1,
      total_xp: 0,
      coin_balance: 0,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    },
  ]);
  driver.connection.allRows.set(
    bootstrapDataSql.catalog,
    INITIAL_CATALOG_SEED.map((item) => ({
      id: item.id,
      display_name: item.displayName,
      category: item.category,
      price_coins: item.priceCoins,
      catalog_version: 1,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    })),
  );

  return {
    adapter: new SQLiteBootstrapDataAdapter(owner),
    driver,
    verifier: new SQLiteBootstrapVerifier(owner),
  };
};

const durableFakeFingerprint = (driver: FakeSQLiteDriver): string =>
  JSON.stringify({
    firstRows: [...driver.connection.firstRows.entries()],
    allRows: [...driver.connection.allRows.entries()],
  });

describe('SQLite safe bootstrap verifier and hydration', () => {
  it('verifies the exact physical surface and returns an immutable durable snapshot', async () => {
    const { adapter, driver, verifier } = await createHarness();

    await expect(verifier.verify()).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    const result = await adapter.read();

    expect(result).toMatchObject({
      ok: true,
      value: {
        migrationVersion: 1,
        installation: { installedAt: TIMESTAMP, onboardingCompletedAt: null },
        profile: { totalXp: 0, coinBalance: 0 },
      },
    });
    if (result.ok) {
      expect(result.value.catalog).toHaveLength(12);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.isFrozen(result.value.catalog)).toBe(true);
      expect('anonymousAnalyticsId' in result.value.installation).toBe(false);
    }
    expect(driver.connection.controlStatements).toEqual([]);
    expect(
      driver.connection.boundStatements.some(({ sql }) =>
        /\b(?:INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql),
      ),
    ).toBe(false);
  });

  it.each([
    'schema',
    'foreign-key',
    'catalog',
    'economy',
    'singleton',
  ] as const)('fails closed on %s mismatch without repair writes', async (mismatch) => {
    const { driver, verifier } = await createHarness();
    if (mismatch === 'schema') {
      const objects = driver.connection.allRows.get(
        bootstrapVerificationSql.schemaObjects,
      );
      driver.connection.allRows.set(
        bootstrapVerificationSql.schemaObjects,
        objects?.slice(1) ?? [],
      );
    } else if (mismatch === 'foreign-key') {
      driver.connection.allRows.set(bootstrapVerificationSql.foreignKeyCheck, [
        { table: 'sessions' },
      ]);
    } else if (mismatch === 'catalog') {
      driver.connection.allRows.set(
        bootstrapDataSql.catalog,
        (driver.connection.allRows.get(bootstrapDataSql.catalog) ?? []).slice(1),
      );
    } else if (mismatch === 'economy') {
      driver.connection.firstRows.set(bootstrapVerificationSql.economy, {
        total_xp: 0,
        coin_balance: 1,
        reward_xp: 0,
        reward_coins: 0,
        purchase_coins: 0,
      });
    } else {
      driver.connection.allRows.set(bootstrapDataSql.settings, []);
    }

    const before = durableFakeFingerprint(driver);

    await expect(verifier.verify()).resolves.toEqual({
      ok: false,
      error: {
        kind: 'bootstrap_verification_error',
        code:
          mismatch === 'economy'
            ? 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED'
            : mismatch === 'catalog' || mismatch === 'singleton'
              ? 'BOOTSTRAP_SEED_INVALID'
              : 'BOOTSTRAP_SCHEMA_INVARIANT_FAILED',
      },
    });
    expect(driver.connection.controlStatements).toEqual([]);
    expect(
      driver.connection.boundStatements.some(({ sql }) =>
        /\b(?:INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql),
      ),
    ).toBe(false);
    expect(durableFakeFingerprint(driver)).toBe(before);
  });

  it('maps invalid row shapes and provider exceptions to one sanitized hydration error', async () => {
    const invalid = await createHarness();
    invalid.driver.connection.allRows.set(bootstrapDataSql.settings, [
      {
        id: 1,
        focus_duration_minutes: 25,
        short_break_minutes: 5,
        long_break_minutes: 15,
        default_mode: 'relax',
        sound_enabled: 2,
        haptics_enabled: 1,
        notifications_enabled: 1,
        analytics_enabled: 1,
        created_at: TIMESTAMP,
        updated_at: TIMESTAMP,
      },
    ]);
    await expect(invalid.adapter.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'BOOTSTRAP_DATA_INVALID' },
    });

    const thrown = await createHarness();
    thrown.driver.connection.allErrors.set(
      bootstrapDataSql.profile,
      new Error('raw sqlite row detail'),
    );
    const result = await thrown.adapter.read();
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_READ_FAILED' },
    });
    expect(JSON.stringify(result)).not.toContain('sqlite row detail');
  });
});
