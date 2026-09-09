import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const read = (path: string): string =>
  readFileSync(resolve(repositoryRoot, path), 'utf8');

describe('US-07-02 production route integrity', () => {
  it('keeps durable Break Start and session route independent from prototype authority', () => {
    const route = read('apps/mobile/src/app/break/session.tsx');
    const resultBranch = read('apps/mobile/src/app/focus/standard-focus-result-branch.tsx');
    const startUseCase = read('packages/application/src/break/start-break.use-case.ts');

    for (const source of [route, resultBranch, startUseCase]) {
      expect(source).not.toMatch(/usePrototype|presentation\/prototype|PrototypeBadge|resolveBreak/);
    }
    expect(route).toContain('useLocalSearchParams');
    expect(route).toContain('validSessionId');
    expect(route).not.toMatch(/findActive|latest|BreakSessionScreen|BreakResultScreen/);
    expect(resultBranch).toMatch(/await startBreak\(sessionId\)[\s\S]*if \(!started\.ok\) return;[\s\S]*pathname: '\/break\/session'/);
    expect(resultBranch).toContain("pathname: '/break/session'");
    expect(startUseCase).not.toMatch(/notification|analytics|RewardRepository/);
  });
});
