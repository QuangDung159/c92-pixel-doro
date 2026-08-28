import { describe, expect, it } from 'vitest';

import migrationLock from './migration-lock.json';
import { productionMigrationRegistry } from './migration-registry';

describe('productionMigrationRegistry', () => {
  it('contains only the immutable initial migration', () => {
    expect(productionMigrationRegistry).toHaveLength(1);
    expect(productionMigrationRegistry[0]).toMatchObject({
      version: 1,
      name: 'initial-schema',
      filename: '001_initial-schema.migration.ts',
      checksum: migrationLock.migrations[0]?.checksum,
      requiresAnonymousAnalyticsId: true,
    });
  });

  it('keeps the initial migration source set explicit and ordered', () => {
    expect(migrationLock.migrations[0]?.sourcePaths).toEqual([
      'apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.ts',
      'apps/mobile/src/infrastructure/database/migrations/schema-manifest.ts',
    ]);
  });
});
