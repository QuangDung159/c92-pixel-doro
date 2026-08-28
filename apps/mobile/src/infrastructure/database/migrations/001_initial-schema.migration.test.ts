import { describe, expect, it } from 'vitest';

import { FakeSQLiteDriver } from '../../../../test/fakes/fake-sqlite-driver';
import { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import { SQLiteTransaction } from '../sqlite-transaction';
import {
  applyInitialSchema,
  initialSchemaMigration,
  initialSchemaVerificationSql,
} from './001_initial-schema.migration';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_COLUMN_MANIFEST,
  INITIAL_SCHEMA_FOREIGN_KEYS,
  INITIAL_SCHEMA_INDEXES,
  INITIAL_SCHEMA_TABLES,
  INITIAL_SCHEMA_TRIGGERS,
} from './schema-manifest';

const SEED_TIMESTAMP = 1_787_836_800_000;
const ANALYTICS_ID = `installation'); DROP TABLE sessions;--`;

const createHarness = async () => {
  const driver = new FakeSQLiteDriver();
  const owner = new SQLiteDatabaseOwner('pixeldoro-schema-test.db', driver);
  const transaction = new SQLiteTransaction(owner);
  await owner.open();
  driver.connection.controlStatements.length = 0;
  driver.connection.boundStatements.length = 0;

  driver.connection.firstRows.set(initialSchemaVerificationSql.emptyDatabase, {
    count: 0,
  });
  driver.connection.allRows.set(
    initialSchemaVerificationSql.schemaTables,
    INITIAL_SCHEMA_TABLES.map((name) => ({ name })),
  );
  driver.connection.firstRows.set(initialSchemaVerificationSql.seedCounts, {
    installation_count: 1,
    settings_count: 1,
    profile_count: 1,
    catalog_count: INITIAL_CATALOG_SEED.length,
    session_count: 0,
    reward_count: 0,
    purchase_count: 0,
    owned_count: 0,
    review_count: 0,
    analytics_count: 0,
    migration_count: 0,
  });

  return { driver, transaction };
};

describe('initial schema migration', () => {
  it('owns the exact normative schema surface', () => {
    expect(initialSchemaMigration.version).toBe(1);
    expect(initialSchemaMigration.name).toBe('initial-schema');
    expect(INITIAL_SCHEMA_TABLES).toHaveLength(11);
    expect(Object.keys(INITIAL_SCHEMA_COLUMN_MANIFEST).sort()).toEqual(
      INITIAL_SCHEMA_TABLES,
    );
    expect(Object.values(INITIAL_SCHEMA_COLUMN_MANIFEST).flat()).toHaveLength(86);
    expect(
      Object.values(INITIAL_SCHEMA_COLUMN_MANIFEST)
        .flat()
        .filter(({ primaryKeyPosition }) => primaryKeyPosition > 0)
        .every(({ notNull }) => notNull),
    ).toBe(true);
    expect(INITIAL_SCHEMA_FOREIGN_KEYS).toHaveLength(11);
    expect(INITIAL_SCHEMA_INDEXES).toHaveLength(14);
    expect(new Set(INITIAL_SCHEMA_INDEXES.map(({ name }) => name)).size).toBe(14);
    expect(INITIAL_SCHEMA_TRIGGERS).toHaveLength(6);
    expect(initialSchemaMigration.schemaStatements).toHaveLength(31);
    expect(INITIAL_CATALOG_SEED).toHaveLength(12);

    const schemaPayload = initialSchemaMigration.schemaStatements.join('\n');
    expect(schemaPayload).not.toContain('IF NOT EXISTS');
    expect(schemaPayload).not.toContain('CURRENT_TIMESTAMP');
    expect(schemaPayload).not.toContain('ON DELETE CASCADE');
    expect(schemaPayload).not.toMatch(/\bpaused\b/i);
    expect(schemaPayload).not.toMatch(/pet_(type|name|stage)/i);
  });

  it('applies static schema and bound exact seed in one transaction', async () => {
    const { driver, transaction } = await createHarness();

    const result = await applyInitialSchema(transaction, {
      timestamp: SEED_TIMESTAMP,
      anonymousAnalyticsId: ANALYTICS_ID,
    });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      ...initialSchemaMigration.schemaStatements,
      'COMMIT',
    ]);

    const installationInsert = driver.connection.boundStatements.find(
      ({ sql }) => sql.includes('INSERT INTO app_installation'),
    );
    expect(installationInsert?.parameters).toEqual([
      1,
      SEED_TIMESTAMP,
      null,
      ANALYTICS_ID,
      SEED_TIMESTAMP,
      SEED_TIMESTAMP,
    ]);
    expect(installationInsert?.sql).not.toContain(ANALYTICS_ID);

    const catalogInserts = driver.connection.boundStatements.filter(({ sql }) =>
      sql.includes('INSERT INTO catalog_items'),
    );
    expect(catalogInserts).toHaveLength(12);
    expect(catalogInserts.map(({ parameters }) => parameters)).toEqual(
      INITIAL_CATALOG_SEED.map((item) => [
        item.id,
        item.displayName,
        item.category,
        item.priceCoins,
        1,
        SEED_TIMESTAMP,
        SEED_TIMESTAMP,
      ]),
    );
    expect(
      driver.connection.boundStatements.some(({ sql }) =>
        sql.includes('INSERT INTO schema_migrations'),
      ),
    ).toBe(false);
  });

  it('rejects invalid seed input before opening a transaction', async () => {
    const { driver, transaction } = await createHarness();

    await expect(
      applyInitialSchema(transaction, {
        timestamp: Number.NaN,
        anonymousAnalyticsId: '',
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'initial_schema_input_error',
        code: 'INVALID_INITIAL_SEED_INPUT',
      },
    });
    expect(driver.connection.controlStatements).toEqual([]);
  });

  it('rejects a non-empty database instead of hiding schema drift', async () => {
    const { driver, transaction } = await createHarness();
    driver.connection.firstRows.set(initialSchemaVerificationSql.emptyDatabase, {
      count: 1,
    });

    await expect(
      applyInitialSchema(transaction, {
        timestamp: SEED_TIMESTAMP,
        anonymousAnalyticsId: 'installation-id',
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(driver.connection.controlStatements).toEqual([
      'BEGIN IMMEDIATE',
      'ROLLBACK',
    ]);
  });

  it('rolls back when a static schema statement fails', async () => {
    const { driver, transaction } = await createHarness();
    const failedStatement = initialSchemaMigration.schemaStatements[3];
    driver.connection.execErrors.set(
      failedStatement,
      new Error('schema provider detail'),
    );

    await expect(
      applyInitialSchema(transaction, {
        timestamp: SEED_TIMESTAMP,
        anonymousAnalyticsId: 'installation-id',
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(driver.connection.controlStatements.at(-1)).toBe('ROLLBACK');
    expect(driver.connection.controlStatements).not.toContain('COMMIT');
  });

  it('rolls back when a bound seed statement fails', async () => {
    const discoveryHarness = await createHarness();
    await applyInitialSchema(discoveryHarness.transaction, {
      timestamp: SEED_TIMESTAMP,
      anonymousAnalyticsId: 'installation-id',
    });
    const failedStatement = discoveryHarness.driver.connection.boundStatements.find(
      ({ sql }) => sql.includes('INSERT INTO catalog_items'),
    )?.sql;
    expect(failedStatement).toBeDefined();

    const { driver, transaction } = await createHarness();
    driver.connection.runErrors.set(
      failedStatement ?? '',
      new Error('seed provider detail'),
    );

    await expect(
      applyInitialSchema(transaction, {
        timestamp: SEED_TIMESTAMP,
        anonymousAnalyticsId: 'installation-id',
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(driver.connection.controlStatements.at(-1)).toBe('ROLLBACK');
    expect(driver.connection.controlStatements).not.toContain('COMMIT');
  });

  it('rolls back when post-apply verification fails', async () => {
    const { driver, transaction } = await createHarness();
    driver.connection.firstRows.set(initialSchemaVerificationSql.seedCounts, {
      installation_count: 1,
      settings_count: 1,
      profile_count: 1,
      catalog_count: 11,
      session_count: 0,
      reward_count: 0,
      purchase_count: 0,
      owned_count: 0,
      review_count: 0,
      analytics_count: 0,
      migration_count: 0,
    });

    const result = await applyInitialSchema(transaction, {
      timestamp: SEED_TIMESTAMP,
      anonymousAnalyticsId: 'installation-id',
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'transaction_technical_error',
        code: 'TRANSACTION_WORK_FAILED',
      },
    });
    expect(driver.connection.controlStatements.at(-1)).toBe('ROLLBACK');
  });
});
