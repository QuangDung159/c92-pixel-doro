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
    expect(route).toContain('useHistoryContributionActions');
    expect(route).toContain('useFocusEffect');
    expect(route).toContain('useAppVisibility');
    expect(route).toContain("previous !== 'active'");
    expect(route).not.toMatch(/from ['"].*(prototype|repository|sqlite|domain)/i);
  });

  it('keeps production History presentation free of mock and durable access', () => {
    const feature = [
      read('apps/mobile/src/presentation/features/history/index.tsx'),
      read('apps/mobile/src/presentation/features/history/focus-history-list.tsx'),
      read('apps/mobile/src/presentation/features/history/focus-history-row.tsx'),
      read('apps/mobile/src/presentation/features/history/history-status-badge.tsx'),
      read('apps/mobile/src/presentation/features/history/history-date-section-header.tsx'),
      read('apps/mobile/src/presentation/features/history/history-pagination-footer.tsx'),
      read('apps/mobile/src/presentation/features/history/history-refresh-status.tsx'),
      read('apps/mobile/src/presentation/features/history/contribution-panel.tsx'),
      read('apps/mobile/src/presentation/features/history/contribution-day-row.tsx'),
      read('apps/mobile/src/presentation/features/history/contribution-graph-strip.tsx'),
      read('apps/mobile/src/presentation/features/history/contribution-legend.tsx'),
      read('apps/mobile/src/presentation/features/history/contribution-visual-tokens.ts'),
    ].join('\n');
    expect(feature).toContain('FocusHistoryList');
    expect(feature).toContain('scheduledEndLocalDate');
    expect(feature).toContain('7 ngày gần đây');
    expect(feature).not.toMatch(/Prototype|mock|sample|repository|sqlite/i);
    expect(feature).not.toMatch(/XP|Coin|new Date\(/);
  });

  it('keeps every History route and presentation component reviewable', () => {
    for (const path of [
      'apps/mobile/src/app/(tabs)/history.tsx',
      'apps/mobile/src/presentation/features/history/index.tsx',
      'apps/mobile/src/presentation/features/history/focus-history-list.tsx',
      'apps/mobile/src/presentation/features/history/focus-history-row.tsx',
      'apps/mobile/src/presentation/features/history/history-status-badge.tsx',
      'apps/mobile/src/presentation/features/history/history-date-section-header.tsx',
      'apps/mobile/src/presentation/features/history/history-pagination-footer.tsx',
      'apps/mobile/src/presentation/features/history/history-refresh-status.tsx',
      'apps/mobile/src/presentation/features/history/contribution-panel.tsx',
      'apps/mobile/src/presentation/features/history/contribution-day-row.tsx',
      'apps/mobile/src/presentation/features/history/contribution-graph-strip.tsx',
      'apps/mobile/src/presentation/features/history/contribution-legend.tsx',
      'apps/mobile/src/presentation/features/history/contribution-visual-tokens.ts',
    ]) {
      expect(read(path).split('\n').length, path).toBeLessThan(300);
    }
  });

  it('uses one virtualized History scroll owner without changing the shell default', () => {
    const screen = read('apps/mobile/src/presentation/features/history/index.tsx');
    const list = read('apps/mobile/src/presentation/features/history/focus-history-list.tsx');
    const shell = read('apps/mobile/src/presentation/components/screen-shell.tsx');
    expect(screen).toContain('scrollable={false}');
    expect(list).toContain('SectionList');
    expect(list).not.toContain('ScrollView');
    expect(shell).toContain('scrollable = true');
  });

  it('keeps the contribution graph static, decorative and free of raw color authority', () => {
    const graph = read(
      'apps/mobile/src/presentation/features/history/contribution-graph-strip.tsx',
    );
    const legend = read(
      'apps/mobile/src/presentation/features/history/contribution-legend.tsx',
    );
    const visualTokens = read(
      'apps/mobile/src/presentation/features/history/contribution-visual-tokens.ts',
    );
    expect(graph).toContain('accessibilityElementsHidden');
    expect(graph).toContain('no-hide-descendants');
    expect(legend).toContain('accessibilityRole="text"');
    expect(visualTokens).toContain('palette.accentDark');
    expect(visualTokens).toContain('palette.white');
    expect([graph, legend, visualTokens].join('\n')).not.toMatch(
      /#[0-9a-f]{3,8}|onPress|Pressable|Touchable|ScrollView|Animated|repository|sqlite/i,
    );
    expect(graph).not.toMatch(/numberOfLines|adjustsFontSizeToFit|minimumFontScale/);
  });

  it('allows EPIC-10 to replace Settings while preserving still-used prototype routes', () => {
    expect(read('apps/mobile/src/presentation/features/settings/index.tsx'))
      .not.toContain('PrototypeBadge');
    expect(read('apps/mobile/src/app/_layout.tsx')).toContain('PrototypeProvider');
  });

  it('owns history_viewed at the controller boundary without route or presentation coupling', () => {
    const controller = read('apps/mobile/src/application/history/history.controller.ts');
    const recorder = read('apps/mobile/src/application/history/history-analytics.recorder.ts');
    const routeAndPresentation = [
      read('apps/mobile/src/app/(tabs)/history.tsx'),
      read('apps/mobile/src/presentation/features/history/index.tsx'),
    ].join('\n');
    expect(controller).toContain('recordViewedBestEffort');
    expect(recorder).toContain("eventName: 'history_viewed'");
    expect(recorder).toContain('ANALYTICS_EVENT_TTL_MS');
    expect(routeAndPresentation).not.toContain('history_viewed');
    expect(routeAndPresentation).not.toContain('analyticsQueue');
  });
});
