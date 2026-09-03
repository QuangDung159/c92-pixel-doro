import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const read = (path: string): string =>
  readFileSync(resolve(repositoryRoot, path), 'utf8');

const listSourceFiles = (directory: string): readonly string[] => {
  const absolute = resolve(repositoryRoot, directory);
  return readdirSync(absolute).flatMap((entry) => {
    const relative = `${directory}/${entry}`;
    return statSync(resolve(repositoryRoot, relative)).isDirectory()
      ? listSourceFiles(relative)
      : /\.tsx?$/.test(relative)
        ? [relative]
        : [];
  });
};

const productionTrialFiles = [
  'apps/mobile/src/app/(onboarding)/index.tsx',
  'apps/mobile/src/app/focus/session.tsx',
  'apps/mobile/src/app/focus/result.tsx',
  ...listSourceFiles('apps/mobile/src/presentation/features/onboarding-trial')
    .filter((path) => !path.includes('.test.')),
];

describe('EPIC-05 production integrity', () => {
  it('keeps production trial branches independent from prototype and persistence authority', () => {
    for (const path of productionTrialFiles) {
      const source = read(path);
      expect(source, path).not.toContain('presentation/prototype');
      expect(source, path).not.toContain('usePrototype');
      expect(source, path).not.toMatch(/infrastructure\/database|sqlite|repository/i);
    }
    expect(read('apps/mobile/src/app/focus/prototype-session-branch.tsx'))
      .toContain('usePrototype');
    expect(read('apps/mobile/src/app/focus/prototype-result-branch.tsx'))
      .toContain('usePrototype');
  });

  it('keeps every scoped UI/source module within 300 lines', () => {
    const scoped = [
      ...productionTrialFiles,
      'apps/mobile/src/app/focus/prototype-session-branch.tsx',
      'apps/mobile/src/app/focus/prototype-result-branch.tsx',
      'apps/mobile/src/application/onboarding-trial/onboarding-analytics.recorder.ts',
      'apps/mobile/src/composition/review/onboarding-trial-review-fixture.ts',
    ];
    for (const path of scoped) {
      expect(read(path).split('\n').length, path).toBeLessThanOrEqual(300);
    }
  });

  it('keeps milestones closed, private, and separate from standard Focus analytics', () => {
    const recorder = read(
      'apps/mobile/src/application/onboarding-trial/onboarding-analytics.recorder.ts',
    );
    expect(recorder).toContain("eventName: 'onboarding_started'");
    expect(recorder).toContain("eventName: 'onboarding_completed'");
    expect(recorder).toContain('properties: Object.freeze({})');
    expect(recorder).not.toMatch(
      /focus_session_started|focus_session_completed|focus_session_failed|focus_session_cancelled|reward_granted/,
    );
  });

  it('allows only the finite dev-gated Epic exit fixture names', () => {
    const sourceFiles = listSourceFiles('apps/mobile/src')
      .filter((path) => !path.includes('.test.'));
    for (const scenario of [
      'epic_05_fresh_end_to_end',
      'epic_05_exclusion_seed',
    ]) {
      const owners = sourceFiles.filter((path) => read(path).includes(scenario));
      expect(owners, scenario).toEqual([
        'apps/mobile/src/composition/review/onboarding-trial-review-fixture.ts',
      ]);
    }
    const composition = read('apps/mobile/src/composition/create-mobile-application.ts');
    expect(composition).toContain("typeof __DEV__ !== 'undefined'");
    expect(composition).toContain('options.diagnosticsEnabled !== false');
  });

  it('reuses the common reward, Pet, status, and button accessibility contracts', () => {
    const allProduction = listSourceFiles('apps/mobile/src')
      .filter((path) => !path.includes('.test.'))
      .map((path) => read(path))
      .join('\n');
    expect(allProduction.match(/export const RewardSummary\b/g)).toHaveLength(1);
    expect(allProduction.match(/export const PetVisualStatus\b/g)).toHaveLength(1);
    expect(allProduction.match(/export const Button\b/g)).toHaveLength(1);
    const countdown = read(
      'apps/mobile/src/presentation/features/onboarding-trial/trial-countdown.tsx',
    );
    expect(countdown).toContain('accessibilityLabel');
    expect(countdown).toContain('accessibilityLiveRegion');
    const result = read(
      'apps/mobile/src/presentation/features/onboarding-trial/onboarding-trial-result-screen.tsx',
    );
    expect(result).toContain('<RewardSummary');
    expect(result).toContain('<PetVisualStatus');
  });
});
