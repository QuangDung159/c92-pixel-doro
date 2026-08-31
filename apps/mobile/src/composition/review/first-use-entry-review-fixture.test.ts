import { describe, expect, it } from 'vitest';

import { FirstUseEntryController } from '@/application';

import { createFirstUseEntryReviewFixture } from './first-use-entry-review-fixture';

describe('first-use entry review fixture', () => {
  it('is absent when disabled, missing or invalid', () => {
    expect(createFirstUseEntryReviewFixture('first_use_new', false)).toBeUndefined();
    expect(createFirstUseEntryReviewFixture(undefined, true)).toBeUndefined();
    expect(createFirstUseEntryReviewFixture('unknown', true)).toBeUndefined();
  });

  it.each([
    ['first_use_new', 'onboarding_intro'],
    ['first_use_returning', 'home'],
    ['first_use_running', 'trial_running'],
    ['first_use_completed', 'trial_result'],
    ['first_use_cancelled', 'onboarding_intro'],
  ] as const)('feeds %s facts through the production controller', async (scenario, destination) => {
    const fixture = createFirstUseEntryReviewFixture(scenario, true);
    expect(fixture).toBeDefined();
    if (fixture === undefined) return;
    const controller = new FirstUseEntryController(fixture);

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({ status: 'ready', destination });
  });

  it('maps its read-error fact through the production error contract', async () => {
    const fixture = createFirstUseEntryReviewFixture('first_use_read_error', true);
    expect(fixture).toBeDefined();
    if (fixture === undefined) return;
    const controller = new FirstUseEntryController(fixture);

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      error: { code: 'FIRST_USE_ENTRY_READ_FAILED' },
    });

    await controller.refresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      destination: 'onboarding_intro',
    });
  });
});
