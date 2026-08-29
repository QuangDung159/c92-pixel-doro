import {
  bootstrapVerificationError,
  type BootstrapVerificationErrorCode,
  type BootstrapVerifierPort,
} from '@/application';

import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import { SQLiteExecutor } from '../sqlite-executor';
import { migrationInspectionSql } from '../migration-runner';
import { initialSchemaMigration } from '../migrations/001_initial-schema.migration';
import { productionMigrationRegistry } from '../migrations/migration-registry';
import {
  INITIAL_CATALOG_SEED,
  INITIAL_SCHEMA_COLUMN_MANIFEST,
  INITIAL_SCHEMA_FOREIGN_KEYS,
  INITIAL_SCHEMA_TABLES,
  type InitialSchemaTableName,
} from '../migrations/schema-manifest';
import {
  mapBootstrapRows,
  readBootstrapRows,
  type BootstrapRows,
} from './sqlite-bootstrap-data.adapter';

interface IntegrityRow {
  readonly integrity_check: string;
}

interface SchemaObjectRow {
  readonly type: string;
  readonly name: string;
  readonly tbl_name: string;
  readonly sql: string | null;
}

interface TableInfoRow {
  readonly cid: number;
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

interface MigrationHistoryRow {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly applied_at: number;
}

interface EconomyRow {
  readonly total_xp: number;
  readonly coin_balance: number;
  readonly reward_xp: number;
  readonly reward_coins: number;
  readonly purchase_coins: number;
}

export const bootstrapVerificationSql = {
  integrity: 'PRAGMA integrity_check',
  foreignKeyCheck: 'PRAGMA foreign_key_check',
  schemaObjects: `SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
      AND type IN ('table', 'index', 'trigger')
    ORDER BY type, name`,
  economy: `SELECT
      p.total_xp,
      p.coin_balance,
      COALESCE((SELECT SUM(xp_delta) FROM reward_transactions), 0) AS reward_xp,
      COALESCE((SELECT SUM(coin_delta) FROM reward_transactions), 0) AS reward_coins,
      COALESCE((SELECT SUM(coin_delta) FROM purchase_transactions), 0) AS purchase_coins
    FROM pet_profiles p
    WHERE p.id = 1`,
} as const;

const normalizeDdl = (sql: string): string =>
  sql.trim().replace(/;$/, '').replace(/\s+/g, ' ').toLowerCase();

const expectedSchemaObjects = (): readonly string[] =>
  initialSchemaMigration.schemaStatements
    .map((sql) => {
      const match = /^CREATE\s+(?:UNIQUE\s+)?(TABLE|INDEX|TRIGGER)\s+([a-z0-9_]+)/i.exec(
        sql,
      );
      if (match?.[1] === undefined || match[2] === undefined) {
        throw new Error('trusted_schema_statement_invalid');
      }
      const type = match[1].toLowerCase();
      const name = match[2];
      const ownerMatch = /\sON\s+([a-z0-9_]+)/i.exec(sql);
      const tableName = type === 'table' ? name : ownerMatch?.[1];
      if (tableName === undefined) {
        throw new Error('trusted_schema_owner_invalid');
      }
      return `${type}:${name}:${tableName}:${normalizeDdl(sql)}`;
    })
    .sort();

const arraysEqual = <TValue>(
  actual: readonly TValue[],
  expected: readonly TValue[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

const validHistory = (rows: readonly MigrationHistoryRow[]): boolean =>
  rows.length === productionMigrationRegistry.length &&
  rows.every((row, index) => {
    const expected = productionMigrationRegistry[index];
    return (
      expected !== undefined &&
      row.version === expected.version &&
      row.name === expected.name &&
      row.checksum === expected.checksum &&
      Number.isSafeInteger(row.applied_at) &&
      row.applied_at >= 0 &&
      row.applied_at <= 8_640_000_000_000_000
    );
  });

const validSchemaObjects = (rows: readonly SchemaObjectRow[]): boolean => {
  if (
    rows.some(
      (row) =>
        (row.type !== 'table' && row.type !== 'index' && row.type !== 'trigger') ||
        typeof row.name !== 'string' ||
        typeof row.tbl_name !== 'string' ||
        typeof row.sql !== 'string',
    )
  ) {
    return false;
  }

  const actual = rows
    .map(
      (row) =>
        `${row.type}:${row.name}:${row.tbl_name}:${normalizeDdl(row.sql ?? '')}`,
    )
    .sort();
  return arraysEqual(actual, expectedSchemaObjects());
};

const validColumns = async (executor: SQLiteExecutor): Promise<boolean> => {
  for (const table of INITIAL_SCHEMA_TABLES) {
    const rows = await executor.getAll<TableInfoRow>(
      `PRAGMA table_info(${table})`,
      [],
    );
    const expected = INITIAL_SCHEMA_COLUMN_MANIFEST[table];
    if (
      rows.length !== expected.length ||
      rows.some((row, index) => {
        const column = expected[index];
        return (
          column === undefined ||
          row.cid !== index ||
          row.name !== column.name ||
          row.type !== column.type ||
          row.notnull !== (column.notNull ? 1 : 0) ||
          row.dflt_value !== column.defaultValue ||
          row.pk !== column.primaryKeyPosition
        );
      })
    ) {
      return false;
    }
  }
  return true;
};

const foreignKeyIdentity = (
  table: InitialSchemaTableName,
  row: ForeignKeyRow,
): string => `${table}:${row.from}:${row.table}:${row.to}:${row.on_delete}`;

const validForeignKeys = async (executor: SQLiteExecutor): Promise<boolean> => {
  const actual: string[] = [];
  for (const table of INITIAL_SCHEMA_TABLES) {
    const rows = await executor.getAll<ForeignKeyRow>(
      `PRAGMA foreign_key_list(${table})`,
      [],
    );
    actual.push(...rows.map((row) => foreignKeyIdentity(table, row)));
  }
  const expected = INITIAL_SCHEMA_FOREIGN_KEYS.map(
    (row) =>
      `${row.table}:${row.from}:${row.targetTable}:${row.targetColumn}:RESTRICT`,
  );
  return arraysEqual(actual.sort(), expected.sort());
};

const validCatalog = (rows: BootstrapRows): boolean =>
  rows.catalog.length === INITIAL_CATALOG_SEED.length &&
  rows.catalog.every((row, index) => {
    const expected = INITIAL_CATALOG_SEED[index];
    return (
      expected !== undefined &&
      row.id === expected.id &&
      row.display_name === expected.displayName &&
      row.category === expected.category &&
      row.price_coins === expected.priceCoins &&
      row.catalog_version === 1
    );
  });

const validSeedSurface = (rows: BootstrapRows): boolean =>
  rows.migrations.length === productionMigrationRegistry.length &&
  rows.installations.length === 1 &&
  rows.settings.length === 1 &&
  rows.profiles.length === 1 &&
  validCatalog(rows);

const validEconomy = (row: EconomyRow | null): boolean => {
  if (row === null) {
    return false;
  }
  const values = [
    row.total_xp,
    row.coin_balance,
    row.reward_xp,
    row.reward_coins,
    row.purchase_coins,
  ];
  return (
    values.every((value) => Number.isSafeInteger(value)) &&
    row.total_xp === row.reward_xp &&
    row.coin_balance === row.reward_coins + row.purchase_coins &&
    Number.isSafeInteger(row.reward_coins + row.purchase_coins)
  );
};

export class SQLiteBootstrapVerifier implements BootstrapVerifierPort {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  async verify(): ReturnType<BootstrapVerifierPort['verify']> {
    try {
      const structuralError = await this.owner.withConnection(async (connection) => {
        const executor = new SQLiteExecutor(connection);
        const integrity = await executor.getAll<IntegrityRow>(
          bootstrapVerificationSql.integrity,
          [],
        );
        const foreignKeyViolations = await executor.getAll<unknown>(
          bootstrapVerificationSql.foreignKeyCheck,
          [],
        );
        const objects = await executor.getAll<SchemaObjectRow>(
          bootstrapVerificationSql.schemaObjects,
          [],
        );
        const history = await executor.getAll<MigrationHistoryRow>(
          migrationInspectionSql.history,
          [],
        );
        const economy = await executor.getFirst<EconomyRow>(
          bootstrapVerificationSql.economy,
          [],
        );

        if (
          integrity.length !== 1 ||
          integrity[0]?.integrity_check !== 'ok' ||
          foreignKeyViolations.length !== 0 ||
          !validSchemaObjects(objects) ||
          !validHistory(history) ||
          !(await validColumns(executor)) ||
          !(await validForeignKeys(executor))
        ) {
          return 'BOOTSTRAP_SCHEMA_INVARIANT_FAILED' as const;
        }

        if (!validEconomy(economy)) {
          return 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED' as const;
        }

        return undefined;
      });

      if (structuralError !== undefined) {
        return {
          ok: false,
          error: bootstrapVerificationError(structuralError),
        };
      }

      const rows = await readBootstrapRows(this.owner);
      if (!validSeedSurface(rows)) {
        return {
          ok: false,
          error: bootstrapVerificationError('BOOTSTRAP_SEED_INVALID'),
        };
      }
      if (mapBootstrapRows(rows) === undefined) {
        return {
          ok: false,
          error: bootstrapVerificationError('DURABLE_DATA_CORRUPT'),
        };
      }

      return { ok: true, value: undefined };
    } catch {
      const code: BootstrapVerificationErrorCode = 'DATABASE_READ_FAILED';
      return { ok: false, error: bootstrapVerificationError(code) };
    }
  }
}
