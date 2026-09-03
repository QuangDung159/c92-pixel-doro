import { describe, expect, it, vi } from 'vitest';
import type { SessionRepository } from '@pixeldoro/application';

import { createStandardFocusStartReviewFixture } from './standard-focus-start-review-fixture';

const sessions = {
  findActive: vi.fn(async () => ({ ok: true, value: null })),
  findActiveInTransaction: vi.fn(async () => ({ ok: true, value: null })),
  insertRunningInTransaction: vi.fn(async () => ({ ok: true, value: undefined })),
} as unknown as SessionRepository;

describe('standard focus review fixture', () => {
  it('is finite and gated behind development diagnostics', () => {
    expect(createStandardFocusStartReviewFixture(
      'standard_start_success', false, { nowMs: () => 1_000 }, sessions,
    )).toBeUndefined();
    expect(createStandardFocusStartReviewFixture(
      'unknown', true, { nowMs: () => 1_000 }, sessions,
    )).toBeUndefined();
    expect(createStandardFocusStartReviewFixture(
      'standard_start_committed_relaunch', true, { nowMs: () => 1_000 }, sessions,
    )).toMatchObject({
      scenario: 'standard_start_committed_relaunch',
      prepareCommittedRelaunch: true,
    });
  });

  it('fails one write then delegates Retry without creating prototype truth', async () => {
    const fixture = createStandardFocusStartReviewFixture(
      'standard_start_write_failure_once', true, { nowMs: () => 1_000 }, sessions,
    );
    if (fixture === undefined) throw new Error('fixture unavailable');
    const scope = { transactionId: Symbol('fixture') };
    expect(await fixture.sessions.insertRunningInTransaction(scope, {} as never))
      .toMatchObject({ ok: false, error: { code: 'PERSISTENCE_WRITE_FAILED' } });
    expect(await fixture.sessions.insertRunningInTransaction(scope, {} as never))
      .toMatchObject({ ok: true });
  });

  it('accelerates display time while preserving the production duration path', () => {
    let now = 1_000;
    const fixture = createStandardFocusStartReviewFixture(
      'standard_running_fast_clock', true, { nowMs: () => now }, sessions,
    );
    if (fixture === undefined) throw new Error('fixture unavailable');
    expect(fixture.clock.nowMs()).toBe(1_000);
    now = 2_000;
    expect(fixture.clock.nowMs()).toBe(31_000);
  });

  it('fails one cancel transition and delegates Retry', async () => {
    const transition = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
    const fixture = createStandardFocusStartReviewFixture(
      'standard_cancel_write_failure_once', true, { nowMs: () => 1_000 },
      { ...sessions, transitionFromRunningInTransaction: transition } as SessionRepository,
    );
    if (fixture === undefined) throw new Error('fixture unavailable');
    const scope = { transactionId: Symbol('cancel-fixture') };
    const input = { status: 'cancelled' } as never;
    expect(await fixture.sessions.transitionFromRunningInTransaction(scope, input))
      .toMatchObject({ ok: false, error: { code: 'PERSISTENCE_WRITE_FAILED' } });
    expect(await fixture.sessions.transitionFromRunningInTransaction(scope, input))
      .toMatchObject({ ok: true, value: 'updated' });
  });

  it.each([
    ['standard_strict_background_write_failure_once', 'recordBackgroundedAtInTransaction'],
    ['standard_strict_clear_write_failure_once', 'clearBackgroundedAtInTransaction'],
  ] as const)('fails one Strict episode write for %s', async (scenario, method) => {
    const success = vi.fn(async () => ({ ok: true as const, value: 'updated' as const }));
    const fixture = createStandardFocusStartReviewFixture(
      scenario,
      true,
      { nowMs: () => 2_000 },
      {
        ...sessions,
        recordBackgroundedAtInTransaction: success,
        clearBackgroundedAtInTransaction: success,
      } as SessionRepository,
    );
    if (fixture === undefined) throw new Error('fixture unavailable');
    const write = fixture.sessions[method];
    const scope = { transactionId: Symbol('strict-fixture') };
    expect(await write(scope, {} as never)).toMatchObject({
      ok: false, error: { code: 'PERSISTENCE_WRITE_FAILED' },
    });
    expect(await write(scope, {} as never)).toMatchObject({ ok: true, value: 'updated' });
  });
});
