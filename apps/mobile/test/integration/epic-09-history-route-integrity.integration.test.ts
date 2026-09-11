import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const read = (path: string): string => readFileSync(resolve(repositoryRoot, path), 'utf8');

describe('EPIC-09 production History integrity', () => {
  it('keeps the History route on facade hooks and focus lifecycle', () => {
    const route = read('apps/mobile/src/app/(tabs)/history.tsx');
    expect(route).toContain('useHistoryProjection');
    expect(route).toContain('useHistoryActions');
    expect(route).toContain('useFocusEffect');
    expect(route).not.toMatch(/from ['"].*(prototype|repository|sqlite|domain)/i);
  });

  it('keeps production History presentation free of mock, graph and durable access', () => {
    const feature = [
      read('apps/mobile/src/presentation/features/history/index.tsx'),
      read('apps/mobile/src/presentation/features/history/focus-history-list.tsx'),
      read('apps/mobile/src/presentation/features/history/focus-history-row.tsx'),
      read('apps/mobile/src/presentation/features/history/history-status-badge.tsx'),
    ].join('\n');
    expect(feature).toContain('FocusHistoryList');
    expect(feature).toContain('scheduledEndLocalDate');
    expect(feature).not.toMatch(/Prototype|mock|sample|contribution|repository|sqlite/i);
    expect(feature).not.toMatch(/XP|Coin|new Date\(/);
  });

  it('keeps every History route and presentation component reviewable', () => {
    for (const path of [
      'apps/mobile/src/app/(tabs)/history.tsx',
      'apps/mobile/src/presentation/features/history/index.tsx',
      'apps/mobile/src/presentation/features/history/focus-history-list.tsx',
      'apps/mobile/src/presentation/features/history/focus-history-row.tsx',
      'apps/mobile/src/presentation/features/history/history-status-badge.tsx',
    ]) {
      expect(read(path).split('\n').length, path).toBeLessThan(300);
    }
  });

  it('preserves the later-owner Settings prototype and root provider', () => {
    expect(read('apps/mobile/src/presentation/features/settings/index.tsx'))
      .toContain('PrototypeBadge');
    expect(read('apps/mobile/src/app/_layout.tsx')).toContain('PrototypeProvider');
  });
});
