import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../..', import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('EPIC-10 production Settings integrity', () => {
  it('keeps the route on facade hooks and lifecycle only', () => {
    const route = read('apps/mobile/src/app/(tabs)/settings.tsx');
    expect(route).toContain('useSettingsProjection');
    expect(route).toContain('useSettingsActions');
    expect(route).toContain('useFocusEffect');
    expect(route).not.toMatch(/prototype|repository|sqlite|expo-notifications|expo-audio|expo-haptics/i);
  });

  it('keeps presentation free from persistence, identity and platform SDK implementation', () => {
    const presentation = [
      read('apps/mobile/src/presentation/features/settings/index.tsx'),
      read('apps/mobile/src/presentation/features/settings/settings-sections.tsx'),
      read('apps/mobile/src/presentation/components/toggle-row.tsx'),
    ].join('\n');
    expect(presentation).not.toMatch(/prototype|repository|sqlite|anonymousAnalyticsId|expo-notifications|expo-audio|expo-haptics/i);
    expect(presentation).toContain('ConfirmationDialog');
    expect(presentation).toContain('ToggleRow');
  });

  it('keeps every visual boundary below 300 lines and reviews near 240', () => {
    for (const path of [
      'apps/mobile/src/app/(tabs)/settings.tsx',
      'apps/mobile/src/presentation/features/settings/index.tsx',
      'apps/mobile/src/presentation/features/settings/settings-sections.tsx',
      'apps/mobile/src/presentation/components/toggle-row.tsx',
    ]) expect(read(path).split('\n').length, path).toBeLessThan(240);
  });

  it('adds no schema migration or analytics provider', () => {
    const packageManifest = read('apps/mobile/package.json');
    expect(packageManifest).toContain('expo-audio');
    expect(packageManifest).toContain('expo-haptics');
    expect(packageManifest).not.toMatch(/posthog|segment|amplitude|mixpanel/i);
    expect(read('apps/mobile/src/infrastructure/database/migrations/schema-manifest.ts'))
      .toContain('app_settings');
  });

  it('routes the quick UI review through an isolated dev-only database', () => {
    const composition = read('apps/mobile/src/composition/create-mobile-application.ts');
    const fixture = read('apps/mobile/src/composition/review/settings-review-fixture.ts');
    expect(composition).toContain('EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE');
    expect(fixture).toContain('pixeldoro-us-10-');
    expect(fixture).toContain('epic_10_quick');
  });
});
