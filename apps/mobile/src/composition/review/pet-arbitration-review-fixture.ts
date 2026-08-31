import type { PetCompanionSessionReader } from '@pixeldoro/application';
import type { FreshCommittedTerminalTransition } from '@pixeldoro/domain';

import {
  createPetBaseReviewSessionReader,
  type PetBaseReviewScenario,
} from './pet-base-review-fixture';

export type PetArbitrationReviewScenario =
  | 'preempt_break'
  | 'preempt_focus'
  | 'stale_after_active'
  | 'conflicting_terminal'
  | 'reopen_relaunch'
  | 'background_discard';

export type PetArbitrationReviewAction =
  | Readonly<{ kind: 'wait'; durationMs: number }>
  | Readonly<{ kind: 'set_base'; scenario: PetBaseReviewScenario }>
  | Readonly<{
      kind: 'emit';
      transition: FreshCommittedTerminalTransition;
    }>;

export interface PetArbitrationReviewFixture {
  readonly actions: readonly PetArbitrationReviewAction[];
  readonly sessionReader: PetCompanionSessionReader;
  setBaseScenario(scenario: PetBaseReviewScenario): void;
}

const completed = (
  sessionId: string,
  committedAtMs: number,
): FreshCommittedTerminalTransition => ({
  sessionId,
  committedAtMs,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'relax',
  terminalStatus: 'completed',
  rewardCommitted: true,
});

const failed = (
  sessionId: string,
  committedAtMs: number,
): FreshCommittedTerminalTransition => ({
  sessionId,
  committedAtMs,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'strict',
  terminalStatus: 'failed',
  rewardCommitted: false,
});

const actionTable: Record<
  PetArbitrationReviewScenario,
  readonly PetArbitrationReviewAction[]
> = {
  preempt_break: [
    { kind: 'emit', transition: completed('review-preempt-break', 100) },
    { kind: 'wait', durationMs: 700 },
    { kind: 'set_base', scenario: 'short_break' },
  ],
  preempt_focus: [
    { kind: 'emit', transition: failed('review-preempt-focus', 200) },
    { kind: 'wait', durationMs: 700 },
    { kind: 'set_base', scenario: 'focus' },
  ],
  stale_after_active: [
    { kind: 'set_base', scenario: 'focus' },
    { kind: 'emit', transition: completed('review-stale-result', 50) },
  ],
  conflicting_terminal: [
    { kind: 'emit', transition: completed('review-conflict', 300) },
    { kind: 'wait', durationMs: 400 },
    { kind: 'emit', transition: failed('review-conflict', 301) },
  ],
  reopen_relaunch: [
    { kind: 'emit', transition: completed('review-reopen', 400) },
  ],
  background_discard: [
    { kind: 'emit', transition: completed('review-background', 500) },
  ],
};

const scenarios = new Set<PetArbitrationReviewScenario>([
  'preempt_break',
  'preempt_focus',
  'stale_after_active',
  'conflicting_terminal',
  'reopen_relaunch',
  'background_discard',
]);

export const createPetArbitrationReviewFixture = (
  value: string | undefined,
  enabled: boolean,
): PetArbitrationReviewFixture | undefined => {
  if (
    !enabled ||
    value === undefined ||
    !scenarios.has(value as PetArbitrationReviewScenario)
  ) return undefined;
  const actions = actionTable[value as PetArbitrationReviewScenario];
  let baseScenario: PetBaseReviewScenario = 'idle';
  const sessionReader: PetCompanionSessionReader = {
    findActive: () => {
      const reader = createPetBaseReviewSessionReader(baseScenario, true);
      if (reader === undefined) {
        throw new Error('Pet arbitration review base fixture is unavailable');
      }
      return reader.findActive();
    },
  };
  return {
    actions,
    sessionReader,
    setBaseScenario: (scenario) => {
      baseScenario = scenario;
    },
  };
};
