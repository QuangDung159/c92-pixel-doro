import { describe, expect, it, vi } from 'vitest';
import type { SessionRepository, TransactionScope } from '@pixeldoro/application';

import { createOnboardingTrialReviewFixture } from './onboarding-trial-review-fixture';

const scope: TransactionScope = { transactionId: Symbol('review') };

const createSessions = (): SessionRepository => ({
  findById: vi.fn(),
  findActive: vi.fn(),
  findLatestOnboardingTrial: vi.fn(),
  findByIdInTransaction: vi.fn(),
  findActiveInTransaction: vi.fn(),
  insertRunningInTransaction: vi.fn(async () => ({ ok: true as const, value: undefined })),
  recordBackgroundedAtInTransaction: vi.fn(),
  transitionFromRunningInTransaction: vi.fn(async () => ({
    ok: true as const,
    value: 'updated' as const,
  })),
});

describe('createOnboardingTrialReviewFixture', () => {
  it('is absent unless dev diagnostics explicitly enable a finite scenario', () => {
    const sessions = createSessions();
    expect(createOnboardingTrialReviewFixture(
      'trial_start_failure',
      false,
      { nowMs: () => 1_000 },
      sessions,
    )).toBeUndefined();
    expect(createOnboardingTrialReviewFixture(
      'unknown',
      true,
      { nowMs: () => 1_000 },
      sessions,
    )).toBeUndefined();
  });

  it('injects only the selected write failure', async () => {
    const sessions = createSessions();
    const fixture = createOnboardingTrialReviewFixture(
      'trial_start_failure',
      true,
      { nowMs: () => 1_000 },
      sessions,
    );
    expect(fixture).toBeDefined();
    const result = await fixture!.sessions.insertRunningInTransaction(
      scope,
      {} as Parameters<SessionRepository['insertRunningInTransaction']>[1],
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_WRITE_FAILED', entity: 'sessions' },
    });
    expect(sessions.insertRunningInTransaction).not.toHaveBeenCalled();
  });

  it('accelerates clock readings without changing persisted duration contracts', () => {
    let now = 1_000;
    const fixture = createOnboardingTrialReviewFixture(
      'trial_running_fast_clock',
      true,
      { nowMs: () => now },
      createSessions(),
    );
    expect(fixture?.clock.nowMs()).toBe(1_000);
    now = 2_000;
    expect(fixture?.clock.nowMs()).toBe(31_000);
  });
});
