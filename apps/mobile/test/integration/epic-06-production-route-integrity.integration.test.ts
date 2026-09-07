import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const read = (path: string): string =>
  readFileSync(resolve(repositoryRoot, path), 'utf8');

describe('EPIC-06 production route integrity', () => {
  it('keeps the Standard Focus session route independent from prototype authority', () => {
    const route = read('apps/mobile/src/app/focus/session.tsx');
    const arbitration = read(
      'apps/mobile/src/presentation/features/focus/focus-session-arbitration.ts',
    );

    expect(route).not.toMatch(/PrototypeSessionBranch|usePrototype|presentation\/prototype/);
    expect(arbitration).not.toMatch(/['"]prototype['"]/);
    expect(arbitration).toContain("return 'missing'");
  });
});
