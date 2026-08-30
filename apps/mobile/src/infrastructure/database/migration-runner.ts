import {
  migrationError,
  type MigrationError,
  type MigrationPort,
  type MigrationResult,
  type MigrationRunError,
} from '@/application';
import type {
  ApplicationResult,
  ClockPort,
  IdPort,
} from '@pixeldoro/application';

import type { SQLiteDatabaseOwner } from './sqlite-database-owner';
import { SQLiteExecutor } from './sqlite-executor';
import type { SQLiteTransaction } from './sqlite-transaction';
import type {
  MigrationContext,
  MigrationDescriptor,
} from './migrations/migration-descriptor';

const MAX_TIMESTAMP = 8_640_000_000_000_000;
const MIGRATION_FILENAME =
  /^(\d{3})_([a-z0-9]+(?:-[a-z0-9]+)*)\.migration\.ts$/;
const MIGRATION_CHECKSUM = /^[a-f0-9]{64}$/;

export const migrationInspectionSql = {
  userObjects: `SELECT type, name
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
      AND type IN ('table', 'view', 'index', 'trigger')
    ORDER BY type, name`,
  history: `SELECT version, name, checksum, applied_at
    FROM schema_migrations
    ORDER BY version`,
  latestVersion: `SELECT MAX(version) AS version
    FROM schema_migrations`,
  insertHistory: `INSERT INTO schema_migrations(version, name, checksum, applied_at)
    VALUES (?, ?, ?, ?)`,
} as const;

interface SQLiteObjectRow {
  readonly type: string;
  readonly name: string;
}

interface MigrationHistoryRow {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly applied_at: number;
}

interface LatestVersionRow {
  readonly version: number | null;
}

interface MigrationPreflight {
  readonly fromVersion: number;
  readonly pending: readonly MigrationDescriptor[];
}

export interface MigrationRunnerDependencies {
  readonly owner: SQLiteDatabaseOwner;
  readonly transaction: SQLiteTransaction;
  readonly clock: ClockPort;
  readonly id: IdPort;
  readonly registry: readonly MigrationDescriptor[];
}

const failure = <TValue>(
  error: MigrationError,
): ApplicationResult<TValue, MigrationError> => ({ ok: false, error });

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

const validateRegistry = (
  registry: readonly MigrationDescriptor[],
): MigrationError | undefined => {
  if (registry.length === 0) {
    return migrationError('MIGRATION_REGISTRY_INVALID');
  }

  const names = new Set<string>();
  const filenames = new Set<string>();

  for (const [index, descriptor] of registry.entries()) {
    const expectedVersion = index + 1;
    const filenameMatch =
      typeof descriptor.filename === 'string'
        ? MIGRATION_FILENAME.exec(descriptor.filename)
        : null;
    if (
      descriptor.version !== expectedVersion ||
      !Number.isSafeInteger(descriptor.version) ||
      typeof descriptor.name !== 'string' ||
      descriptor.name.length === 0 ||
      filenameMatch === null ||
      Number(filenameMatch[1]) !== descriptor.version ||
      filenameMatch[2] !== descriptor.name ||
      typeof descriptor.checksum !== 'string' ||
      !MIGRATION_CHECKSUM.test(descriptor.checksum) ||
      typeof descriptor.requiresAnonymousAnalyticsId !== 'boolean' ||
      typeof descriptor.apply !== 'function' ||
      names.has(descriptor.name) ||
      filenames.has(descriptor.filename)
    ) {
      return migrationError('MIGRATION_REGISTRY_INVALID');
    }

    names.add(descriptor.name);
    filenames.add(descriptor.filename);
  }

  return undefined;
};

const validateHistory = (
  rows: readonly MigrationHistoryRow[],
  registry: readonly MigrationDescriptor[],
): ApplicationResult<number, MigrationError> => {
  for (const [index, row] of rows.entries()) {
    const expectedVersion = index + 1;
    if (
      !Number.isSafeInteger(row.version) ||
      !Number.isSafeInteger(row.applied_at) ||
      row.applied_at < 0 ||
      row.applied_at > MAX_TIMESTAMP ||
      typeof row.name !== 'string' ||
      typeof row.checksum !== 'string'
    ) {
      return failure(migrationError('MIGRATION_HISTORY_INVALID'));
    }

    if (row.version > registry.length) {
      return failure(migrationError('DATABASE_SCHEMA_NEWER_THAN_BINARY'));
    }

    if (row.version !== expectedVersion) {
      return failure(migrationError('MIGRATION_VERSION_GAP'));
    }

    const descriptor = registry[index];
    if (descriptor === undefined || descriptor.name !== row.name) {
      return failure(migrationError('MIGRATION_UNKNOWN_APPLIED'));
    }

    if (descriptor.checksum !== row.checksum) {
      return failure(migrationError('MIGRATION_CHECKSUM_MISMATCH'));
    }
  }

  return { ok: true, value: rows.length };
};

export class MigrationRunner implements MigrationPort {
  constructor(private readonly dependencies: MigrationRunnerDependencies) {}

  async migrate(): Promise<
    ApplicationResult<MigrationResult, MigrationRunError>
  > {
    const registryError = validateRegistry(this.dependencies.registry);
    if (registryError !== undefined) {
      return failure(registryError);
    }

    const preflight = await this.preflight();
    if (!preflight.ok) {
      return preflight;
    }

    const appliedVersions: number[] = [];
    for (const descriptor of preflight.value.pending) {
      const context = this.createContext(descriptor);
      if (!context.ok) {
        return context;
      }

      const result = await this.applyMigration(descriptor, context.value);
      if (!result.ok) {
        return result;
      }
      appliedVersions.push(descriptor.version);
    }

    return {
      ok: true,
      value: {
        fromVersion: preflight.value.fromVersion,
        toVersion: this.dependencies.registry.length,
        appliedVersions,
      },
    };
  }

  private async preflight(): Promise<
    ApplicationResult<MigrationPreflight, MigrationError>
  > {
    try {
      return await this.dependencies.owner.withConnection(async (connection) => {
        const executor = new SQLiteExecutor(connection);
        let objects: SQLiteObjectRow[];
        try {
          objects = await executor.getAll<SQLiteObjectRow>(
            migrationInspectionSql.userObjects,
            [],
          );
        } catch {
          return failure(migrationError('MIGRATION_HISTORY_INVALID'));
        }

        if (
          objects.some(
            (row) =>
              typeof row.name !== 'string' || typeof row.type !== 'string',
          )
        ) {
          return failure(migrationError('MIGRATION_HISTORY_INVALID'));
        }

        if (objects.length === 0) {
          return {
            ok: true,
            value: {
              fromVersion: 0,
              pending: this.dependencies.registry,
            },
          };
        }

        const hasHistoryTable = objects.some(
          ({ type, name }) => type === 'table' && name === 'schema_migrations',
        );
        if (!hasHistoryTable) {
          return failure(migrationError('MIGRATION_HISTORY_MISSING'));
        }

        let rows: MigrationHistoryRow[];
        try {
          rows = await executor.getAll<MigrationHistoryRow>(
            migrationInspectionSql.history,
            [],
          );
        } catch {
          return failure(migrationError('MIGRATION_HISTORY_INVALID'));
        }

        if (rows.length === 0) {
          return failure(migrationError('MIGRATION_HISTORY_MISSING'));
        }

        const validated = validateHistory(rows, this.dependencies.registry);
        if (!validated.ok) {
          return validated;
        }

        return {
          ok: true,
          value: {
            fromVersion: validated.value,
            pending: this.dependencies.registry.slice(validated.value),
          },
        };
      });
    } catch {
      return failure(migrationError('MIGRATION_HISTORY_INVALID'));
    }
  }

  private createContext(
    descriptor: MigrationDescriptor,
  ): ApplicationResult<MigrationContext, MigrationError> {
    let appliedAt: number;
    try {
      appliedAt = this.dependencies.clock.nowMs();
    } catch {
      return failure(migrationError('MIGRATION_APPLY_FAILED'));
    }
    if (!isSafeTimestamp(appliedAt)) {
      return failure(migrationError('MIGRATION_APPLY_FAILED'));
    }

    if (!descriptor.requiresAnonymousAnalyticsId) {
      return { ok: true, value: { appliedAt } };
    }

    let anonymousAnalyticsId: string;
    try {
      anonymousAnalyticsId = this.dependencies.id.nextId();
    } catch {
      return failure(migrationError('MIGRATION_APPLY_FAILED'));
    }
    if (anonymousAnalyticsId.length === 0) {
      return failure(migrationError('MIGRATION_APPLY_FAILED'));
    }

    return {
      ok: true,
      value: { appliedAt, anonymousAnalyticsId },
    };
  }

  private applyMigration(
    descriptor: MigrationDescriptor,
    context: MigrationContext,
  ): Promise<ApplicationResult<void, MigrationRunError>> {
    return this.dependencies.transaction.execute(async (scope) => {
      const executor = this.dependencies.transaction.executorFor(scope);

      if (descriptor.version > 1) {
        let latest: LatestVersionRow | null;
        try {
          latest = await executor.getFirst<LatestVersionRow>(
            migrationInspectionSql.latestVersion,
            [],
          );
        } catch {
          return failure(migrationError('MIGRATION_HISTORY_INVALID'));
        }

        if (latest?.version !== descriptor.version - 1) {
          return failure(migrationError('MIGRATION_HISTORY_INVALID'));
        }
      }

      try {
        await descriptor.apply(executor, context);
      } catch {
        return failure(migrationError('MIGRATION_APPLY_FAILED'));
      }

      try {
        const write = await executor.run(migrationInspectionSql.insertHistory, [
          descriptor.version,
          descriptor.name,
          descriptor.checksum,
          context.appliedAt,
        ]);
        if (write.changes !== 1) {
          return failure(migrationError('MIGRATION_HISTORY_WRITE_FAILED'));
        }
      } catch {
        return failure(migrationError('MIGRATION_HISTORY_WRITE_FAILED'));
      }

      return { ok: true, value: undefined };
    });
  }
}
