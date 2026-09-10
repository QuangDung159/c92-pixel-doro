import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../..', import.meta.url));
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

describe('US-07-04 production route integrity', () => {
  it('keeps Cancel and exact terminal Result independent from prototype and rewards', () => {
    const route = read('apps/mobile/src/app/break/session.tsx');
    const screen = read('apps/mobile/src/presentation/features/break/break-started-screen.tsx');
    const useCase = read('packages/application/src/break/cancel-break.use-case.ts');
    expect(route).toContain('useLocalSearchParams');
    expect(route).toContain('cancel(validSessionId)');
    expect(route).not.toMatch(/findActive|findLatest|prototype/i);
    expect(screen).toContain('ConfirmationDialog');
    expect(screen).not.toMatch(/RewardSummary|ProgressionSummary|StatDisplay|Claim/);
    expect(useCase).toContain('completeBreakInTransaction');
    expect(useCase).not.toMatch(/RewardRepository|ProfileRepository|notification|analytics/);
  });
});
