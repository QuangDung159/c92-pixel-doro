import { describe, expect, it, vi } from 'vitest';
import type {
  RewardReceiptRepository,
  SessionRepository,
  TransactionScope,
} from '@pixeldoro/application';
import type { InstallationRepository } from '@/application';

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

const createRewards = (): RewardReceiptRepository => ({
  findById: vi.fn(),
  findBySessionId: vi.fn(),
  findBySessionIdInTransaction: vi.fn(),
  insertInTransaction: vi.fn(async () => ({ ok: true as const, value: undefined })),
});

const createInstallation = (): InstallationRepository => ({
  find: vi.fn(),
  setOnboardingCompleted: vi.fn(async () => ({
    ok: true as const,
    value: 'updated' as const,
  })),
  setAnonymousAnalyticsId: vi.fn(),
});

describe('createOnboardingTrialReviewFixture', () => {
  it('is absent unless dev diagnostics explicitly enable a finite scenario', () => {
    const sessions = createSessions();
    expect(createOnboardingTrialReviewFixture(
      'trial_start_failure',
      false,
      { nowMs: () => 1_000 },
      sessions,
      createRewards(),
    )).toBeUndefined();
    expect(createOnboardingTrialReviewFixture(
      'unknown',
      true,
      { nowMs: () => 1_000 },
      sessions,
      createRewards(),
    )).toBeUndefined();
  });

  it('injects only the selected write failure', async () => {
    const sessions = createSessions();
    const fixture = createOnboardingTrialReviewFixture(
      'trial_start_failure',
      true,
      { nowMs: () => 1_000 },
      sessions,
      createRewards(),
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
      createRewards(),
    );
    expect(fixture?.clock.nowMs()).toBe(1_000);
    now = 2_000;
    expect(fixture?.clock.nowMs()).toBe(31_000);
  });

  it('fails only the first reward insert for the completion recovery fixture', async () => {
    const rewards = createRewards();
    const fixture = createOnboardingTrialReviewFixture(
      'trial_reward_write_failure',
      true,
      { nowMs: () => 1_000 },
      createSessions(),
      rewards,
    );
    const record = {} as Parameters<RewardReceiptRepository['insertInTransaction']>[1];
    expect(await fixture!.rewards.insertInTransaction(scope, record)).toMatchObject({
      ok: false,
      error: { entity: 'reward_transactions' },
    });
    await fixture!.rewards.insertInTransaction(scope, record);
    expect(rewards.insertInTransaction).toHaveBeenCalledTimes(1);
  });

  it('prepares a genuine trial before advancing only the injected startup clock', async () => {
    const fixture = createOnboardingTrialReviewFixture(
      'trial_overdue_running',
      true,
      { nowMs: () => 1_000 },
      createSessions(),
      createRewards(),
    );
    const execute = vi.fn(async () => ({
      ok: true as const,
      value: { outcome: 'started' as const, session: {} },
    }));

    expect(fixture?.clock.nowMs()).toBe(1_000);
    await expect(fixture?.prepareForStartup?.(
      { execute } as never,
      { execute: vi.fn() } as never,
    )).resolves.toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(fixture?.clock.nowMs()).toBe(301_001);
  });

  it('prepares reopen through production completion without exposing a fresh event', async () => {
    const fixture = createOnboardingTrialReviewFixture(
      'trial_completed_reopen',
      true,
      { nowMs: () => 1_000 },
      createSessions(),
      createRewards(),
    );
    const start = vi.fn(async () => ({
      ok: true as const,
      value: { outcome: 'started' as const, session: { id: 'trial-1' } },
    }));
    const complete = vi.fn(async () => ({
      ok: true as const,
      value: { outcome: 'completed_fresh' as const },
    }));

    await expect(fixture?.prepareForStartup?.(
      { execute: start } as never,
      { execute: complete } as never,
    )).resolves.toBe(true);
    expect(complete).toHaveBeenCalledWith('trial-1');
  });

  it('fails only the first Continue installation write', async () => {
    const installation = createInstallation();
    const fixture = createOnboardingTrialReviewFixture(
      'trial_continue_failure',
      true,
      { nowMs: () => 1_000 },
      createSessions(),
      createRewards(),
      installation,
    );

    await expect(fixture?.installation?.setOnboardingCompleted(2_000, 2_000))
      .resolves.toMatchObject({ ok: false, error: { entity: 'app_installation' } });
    await expect(fixture?.installation?.setOnboardingCompleted(2_000, 2_000))
      .resolves.toEqual({ ok: true, value: 'updated' });
    expect(installation.setOnboardingCompleted).toHaveBeenCalledOnce();
  });
});
