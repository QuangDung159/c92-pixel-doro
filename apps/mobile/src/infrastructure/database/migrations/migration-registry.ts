import { initialSchemaMigration } from './001_initial-schema.migration';
import migrationLock from './migration-lock.json';
import type { MigrationDescriptor } from './migration-descriptor';

const initialSchemaLock = migrationLock.migrations.find(
  ({ version }) => version === initialSchemaMigration.version,
);

if (initialSchemaLock === undefined) {
  throw new Error('initial_schema_migration_lock_missing');
}

export const productionMigrationRegistry: readonly MigrationDescriptor[] = [
  {
    version: initialSchemaMigration.version,
    name: initialSchemaMigration.name,
    filename: initialSchemaLock.filename,
    checksum: initialSchemaLock.checksum,
    requiresAnonymousAnalyticsId: true,
    apply: async (executor, context) => {
      if (context.anonymousAnalyticsId === undefined) {
        throw new Error('initial_schema_analytics_id_missing');
      }

      await initialSchemaMigration.apply(executor, {
        timestamp: context.appliedAt,
        anonymousAnalyticsId: context.anonymousAnalyticsId,
      });
    },
  },
];
