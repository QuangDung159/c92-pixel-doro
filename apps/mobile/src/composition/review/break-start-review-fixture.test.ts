import { describe, expect, it, vi } from 'vitest';

import type { SessionRepository } from '@pixeldoro/application';
import {
  breakStartReviewDatabaseName,
  createBreakStartReviewFixture,
  resolveBreakStartReviewScenario,
} from './break-start-review-fixture';

describe('Break start review fixture', () => {
  it('accepts finite dev-only scenarios and isolates the database name', () => {
    expect(resolveBreakStartReviewScenario('break_start_short', false)).toBeUndefined();
    expect(resolveBreakStartReviewScenario('unknown', true)).toBeUndefined();
    expect(resolveBreakStartReviewScenario('break_start_long_due', true))
      .toBe('break_start_long_due');
    expect(breakStartReviewDatabaseName('break_start_short'))
      .toBe('pixeldoro-us-07-02-break_start_short.db');
  });

  it('fails only the first Break insert then delegates', async () => {
    const insert = vi.fn(async () => ({ ok: true as const, value: undefined }));
    const delegate = {
      findById: vi.fn(), findByIdInTransaction: vi.fn(), findActiveInTransaction: vi.fn(),
      insertRunningInTransaction: insert,
    } as unknown as SessionRepository;
    const fixture = createBreakStartReviewFixture('break_start_write_failure_once', delegate);
    if (fixture === undefined) throw new Error('fixture_missing');
    const record = { sessionType: 'short_break' } as never;
    expect(await fixture.sessions.insertRunningInTransaction({ transactionId: Symbol() }, record))
      .toMatchObject({ ok: false, error: { code: 'PERSISTENCE_WRITE_FAILED' } });
    expect(await fixture.sessions.insertRunningInTransaction({ transactionId: Symbol() }, record))
      .toEqual({ ok: true, value: undefined });
    expect(insert).toHaveBeenCalledOnce();
  });
});
