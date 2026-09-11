import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const read = (path: string): string => readFileSync(resolve(repoRoot, path), 'utf8');

describe('EPIC-08 aggregate production boundary', () => {
  it('keeps Home and Shop on production facades without persistence or prototype access', () => {
    for (const route of [
      'apps/mobile/src/app/(tabs)/index.tsx',
      'apps/mobile/src/app/(tabs)/shop.tsx',
    ]) {
      const source = read(route);
      expect(source, route).not.toMatch(/prototype-context|SQLite|catalog\.list|ownedItems/);
    }
    expect(read('apps/mobile/src/app/(tabs)/shop.tsx')).toContain('useShopProjection');
    expect(read('apps/mobile/src/app/(tabs)/index.tsx')).toContain(
      'useRoomDecorationsProjection',
    );
  });

  it('retains later-Epic prototype ownership while Shop remains retired from it', () => {
    const root = read('apps/mobile/src/app/_layout.tsx');
    expect(root).toContain('PrototypeProvider');
    expect(read('apps/mobile/src/presentation/features/history/index.tsx'))
      .toMatch(/prototype/i);
    expect(read('apps/mobile/src/presentation/features/settings/index.tsx'))
      .toMatch(/prototype/i);
    expect(read('apps/mobile/src/presentation/features/shop/index.tsx'))
      .not.toMatch(/prototype|mock|sample/i);
  });

  it('adds no migration or analytics provider dependency for the exit slice', () => {
    const migrations = readdirSync(resolve(
      repoRoot,
      'apps/mobile/src/infrastructure/database/migrations',
    )).filter((name) => /^\d+.*\.migration\.ts$/.test(name));
    expect(migrations).toEqual(['001_initial-schema.migration.ts']);
    const packageManifest = read('apps/mobile/package.json');
    expect(packageManifest).not.toMatch(/posthog|segment|amplitude|mixpanel/i);
  });

  it('prepares the isolated exit fixture from the normal application boot path', () => {
    const composition = read('apps/mobile/src/composition/create-mobile-application.ts');
    const boot = composition.indexOf('boot: async () =>');
    const prepare = composition.indexOf('epic08ExitReviewFixture.prepare');
    expect(composition).toContain('EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE');
    expect(composition).toContain('epic08ExitReviewDatabaseName(epic08ExitReviewScenario)');
    expect(boot).toBeGreaterThan(-1);
    expect(prepare).toBeGreaterThan(boot);
    expect(composition.indexOf('epic08ExitReviewFixture.prepare', prepare + 1)).toBe(-1);
  });
});
