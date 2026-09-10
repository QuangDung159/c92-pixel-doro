import { describe, expect, it, vi } from 'vitest';

import type { SessionRepository } from '@pixeldoro/application';
import {
  breakRunningReviewDatabaseName,
  createBreakRunningReviewFixture,
  resolveBreakRunningReviewScenario,
} from './break-running-review-fixture';

describe('Break running review fixture', () => {
  it('accepts only finite dev scenarios and isolates durable data', () => {
    expect(resolveBreakRunningReviewScenario('break_running_short_fast_clock', false))
      .toBeUndefined();
    expect(resolveBreakRunningReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveBreakRunningReviewScenario('break_running_long_fast_clock', true))
      .toBe('break_running_long_fast_clock');
    expect(breakRunningReviewDatabaseName('break_completion_write_failure_once'))
      .toBe('pixeldoro-us-07-03-break_completion_write_failure_once.db');
    expect(resolveBreakRunningReviewScenario('break_cancel_long', true))
      .toBe('break_cancel_long');
    expect(breakRunningReviewDatabaseName('break_cancel_short'))
      .toBe('pixeldoro-us-07-04-break_cancel_short.db');
  });

  it('uses wall time before preparation and exposes the accelerated scheduler cadence', () => {
    vi.useFakeTimers();
    const delegate = {} as SessionRepository;
    const fixture = createBreakRunningReviewFixture(
      'break_running_short_fast_clock', { nowMs: () => 1_000 }, delegate,
    );
    if (fixture === undefined || fixture.scheduler === undefined) throw new Error('fixture_missing');
    expect(fixture.clock.nowMs()).toBe(1_000);
    const tick = vi.fn();
    fixture.scheduler.schedule(tick, 1_000);
    vi.advanceTimersByTime(120);
    expect(tick).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
