import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('US-07-05 production integrity', () => {
  it('keeps Break route independent from prototype and raw notification SDK authority', () => {
    const route = read('apps/mobile/src/app/break/session.tsx');
    const screen = read('apps/mobile/src/presentation/features/break/break-started-screen.tsx');
    expect(`${route}\n${screen}`).not.toMatch(
      /from ['"].*(prototype|expo-notifications|repository|reward)/i,
    );
  });

  it('owns one root response bridge for Focus and Break', () => {
    const root = read('apps/mobile/src/app/_layout.tsx');
    const bridge = read(
      'apps/mobile/src/app/standard-focus-notification-navigation-bridge.tsx',
    );
    expect(root.match(/StandardFocusNotificationNavigationBridge/g)).toHaveLength(2);
    expect(bridge).toContain("pathname: '/break/session'");
    expect(bridge).toContain("pathname: '/focus/result'");
  });
});
