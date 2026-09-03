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
      'standard_start_success', false, sessions,
    )).toBeUndefined();
    expect(createStandardFocusStartReviewFixture('unknown', true, sessions)).toBeUndefined();
    expect(createStandardFocusStartReviewFixture(
      'standard_start_committed_relaunch', true, sessions,
    )).toMatchObject({
      scenario: 'standard_start_committed_relaunch',
      prepareCommittedRelaunch: true,
    });
  });

  it('fails one write then delegates Retry without creating prototype truth', async () => {
    const fixture = createStandardFocusStartReviewFixture(
      'standard_start_write_failure_once', true, sessions,
    );
    if (fixture === undefined) throw new Error('fixture unavailable');
    const scope = { transactionId: Symbol('fixture') };
    expect(await fixture.sessions.insertRunningInTransaction(scope, {} as never))
      .toMatchObject({ ok: false, error: { code: 'PERSISTENCE_WRITE_FAILED' } });
    expect(await fixture.sessions.insertRunningInTransaction(scope, {} as never))
      .toMatchObject({ ok: true });
  });
});
