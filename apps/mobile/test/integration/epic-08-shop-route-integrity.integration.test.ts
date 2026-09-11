import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('EPIC-08 production Shop integrity', () => {
  it('keeps the Shop route on the application facade and focus lifecycle', () => {
    const route = read('apps/mobile/src/app/(tabs)/shop.tsx');
    expect(route).toContain('useShopProjection');
    expect(route).toContain('useShopActions');
    expect(route).toContain('useFocusEffect');
    expect(route).not.toMatch(/from ['"].*(prototype|repository|sqlite|domain)/i);
  });

  it('keeps production Shop presentation free of mock catalog and repository access', () => {
    const screen = read('apps/mobile/src/presentation/features/shop/index.tsx');
    expect(screen).toContain('<ItemGrid actionForItem={actionForItem} items={projection.shop.items} />');
    expect(screen).toContain('<ConfirmationDialog');
    expect(screen).not.toMatch(/mock|sample|prototype|repository|sqlite|onEquip/i);
  });

  it('keeps route, screen and reusable item components reviewable', () => {
    for (const path of [
      'apps/mobile/src/app/(tabs)/shop.tsx',
      'apps/mobile/src/presentation/features/shop/index.tsx',
      'apps/mobile/src/presentation/components/item-grid.tsx',
      'apps/mobile/src/presentation/components/item-tile.tsx',
    ]) {
      expect(read(path).split('\n').length, path).toBeLessThan(300);
    }
  });
});
