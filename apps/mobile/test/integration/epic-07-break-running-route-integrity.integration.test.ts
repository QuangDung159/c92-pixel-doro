import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const read = (path: string): string => readFileSync(resolve(repositoryRoot, path), 'utf8');

describe('US-07-03 production route integrity', () => {
  it('keeps countdown, completion and exact identity on durable production paths', () => {
    const route = read('apps/mobile/src/app/break/session.tsx');
    const controller = read('apps/mobile/src/application/break/break-session.controller.ts');
    const lifecycle = read('apps/mobile/src/application/break/break-lifecycle.controller.ts');
    const reconcile = read('packages/application/src/break/reconcile-break.use-case.ts');

    expect(route).toContain('useLocalSearchParams');
    expect(route).toContain('validSessionId');
    expect(route).toContain('activate(validSessionId)');
    expect(route).not.toMatch(/findActive|findLatest|prototype/i);
    expect(controller).toContain('projectRemainingTime');
    expect(controller).toContain('onDeadlineReached');
    expect(lifecycle).toContain('setAppVisible(false)');
    expect(lifecycle).not.toMatch(/recordBackgroundedAt|clearBackgroundedAt/);
    expect(reconcile).toContain('completeBreakInTransaction');
    expect(reconcile).not.toMatch(/notification|analytics|RewardRepository|rewardReceipt/);
  });
});
