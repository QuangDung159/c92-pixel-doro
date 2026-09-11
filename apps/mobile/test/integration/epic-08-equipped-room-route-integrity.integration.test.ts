import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('US-08-04 equipped room integrity', () => {
  it('keeps Home on facade lifecycle and committed projection', () => {
    const route = read('apps/mobile/src/app/(tabs)/index.tsx');
    expect(route).toContain('useRoomDecorationsProjection');
    expect(route).toContain('useFocusEffect');
    expect(route).toContain('activateRoom');
    expect(route).toContain('deactivateRoom');
    expect(route).not.toMatch(/SQLite|ownedItems|catalog\.list/);
  });

  it('keeps application projection free from presentation assets and writes', () => {
    const projection = read('packages/application/src/room/load-equipped-room-projection.use-case.ts');
    expect(projection).not.toMatch(/react-native|\.png|insert|setEquipped|delete/);
    expect(projection).toContain("listByProfile(MVP_PROFILE_ID)");
  });

  it('keeps room failures local and decoration pixels non-interactive', () => {
    const controller = read('apps/mobile/src/application/room/room-decorations.controller.ts');
    const layer = read('apps/mobile/src/presentation/features/home/equipped-room-decoration-layer.tsx');
    expect(controller).not.toMatch(/criticalRecovery|enterRecovery/);
    expect(layer).toContain('pointerEvents="none"');
    expect(layer).toContain('importantForAccessibility="no-hide-descendants"');
    expect(layer).toContain('resizeMode="stretch"');
    expect(layer).toContain("height: '100%', width: '100%'");
  });
});
