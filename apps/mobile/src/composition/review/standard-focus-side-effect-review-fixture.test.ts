import { describe, expect, it, vi } from 'vitest';

import type {
  AnalyticsQueue,
  BreakCompletionNotificationPort,
  FocusCompletionNotificationPort,
  FocusNotificationResponseSource,
  SessionCompletionNotificationInput,
  ResetNotificationCleanupPort,
} from '@/application';
import { createStandardFocusSideEffectReviewFixture } from './standard-focus-side-effect-review-fixture';

const notifications = () => ({
  prepare: vi.fn(async () => ({ ok: true as const, value: undefined })),
  readPermission: vi.fn(async () => ({ ok: true as const, value: 'allowed' as const })),
  requestPermission: vi.fn(async () => ({ ok: true as const, value: 'allowed' as const })),
  ensure: vi.fn(async (_input: SessionCompletionNotificationInput) =>
    ({ ok: true as const, value: 'scheduled' as const })),
  cancel: vi.fn(async () => ({ ok: true as const, value: 'cancelled' as const })),
  readInitial: vi.fn(async () => null),
  subscribe: vi.fn(async () => () => undefined),
  clearInitial: vi.fn(async () => undefined),
  cancelKnownSession: vi.fn(async () => ({ ok: true as const, value: undefined })),
}) satisfies FocusCompletionNotificationPort & BreakCompletionNotificationPort &
  FocusNotificationResponseSource &
  ResetNotificationCleanupPort;

const queue = (): AnalyticsQueue => ({
  enqueueBounded: vi.fn(async () => ({ ok: true as const, value: 'enqueued' as const })),
  listDue: vi.fn(async () => ({ ok: true as const, value: [] })),
  markRetry: vi.fn(async () => ({ ok: true as const, value: 'updated' as const })),
  deleteDelivered: vi.fn(async () => ({ ok: true as const, value: 0 })),
  clear: vi.fn(async () => ({ ok: true as const, value: 0 })),
});

describe('standard focus side-effect review fixture', () => {
  it('accelerates an owned Break notification without changing its typed identity', async () => {
    const delegate = notifications();
    const fixture = createStandardFocusSideEffectReviewFixture(
      'break_side_effect_fast_notification', true, delegate, queue(),
    );
    const before = Date.now();
    await fixture?.notifications.ensure({
      kind: 'break_completion', operationKey: 'break-complete:break-1',
      sessionId: 'break-1', endsAt: 9_999_999_999_999, soundEnabled: true,
      breakType: 'short_break',
    });
    expect(delegate.ensure).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'break_completion', operationKey: 'break-complete:break-1',
      breakType: 'short_break', endsAt: expect.any(Number),
    }));
    const scheduled = vi.mocked(delegate.ensure).mock.calls[0]?.[0];
    expect(scheduled?.endsAt).toBeGreaterThanOrEqual(before + 30_000);
    expect(scheduled?.endsAt).toBeLessThanOrEqual(Date.now() + 30_000);
  });

  it('keeps review hooks unavailable outside a development gate', () => {
    expect(createStandardFocusSideEffectReviewFixture(
      'standard_side_effect_fast_notification', false, notifications(), queue(),
    )).toBeUndefined();
  });

  it('uses a finite 30-second native trigger without changing the session record', async () => {
    const delegate = notifications();
    const fixture = createStandardFocusSideEffectReviewFixture(
      'standard_side_effect_fast_notification', true, delegate, queue(),
    );
    expect(fixture).toBeDefined();
    const before = Date.now();
    await fixture?.notifications.ensure({
      kind: 'standard_focus_completion',
      operationKey: 'standard-focus-complete:focus-1',
      sessionId: 'focus-1', endsAt: 9_999_999_999_999, soundEnabled: true,
    });
    expect(delegate.ensure).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'focus-1',
      endsAt: expect.any(Number),
    }));
    const scheduled = vi.mocked(delegate.ensure).mock.calls[0]?.[0];
    expect(scheduled?.endsAt).toBeGreaterThanOrEqual(before + 30_000);
    expect(scheduled?.endsAt).toBeLessThanOrEqual(Date.now() + 30_000);
  });

  it('injects each provider/queue failure only once', async () => {
    const delegate = notifications();
    const schedule = createStandardFocusSideEffectReviewFixture(
      'standard_side_effect_schedule_failure_once', true, delegate, queue(),
    );
    const input = {
      kind: 'standard_focus_completion' as const,
      operationKey: 'standard-focus-complete:focus-1',
      sessionId: 'focus-1', endsAt: Date.now() + 60_000, soundEnabled: true,
    };
    expect(await schedule?.notifications.ensure(input)).toMatchObject({ ok: false });
    expect(await schedule?.notifications.ensure(input)).toMatchObject({ ok: true });

    const analytics = queue();
    const queueFailure = createStandardFocusSideEffectReviewFixture(
      'standard_side_effect_queue_failure_once', true, notifications(), analytics,
    );
    const event = {
      eventId: 'focus_session_started:focus-1', eventName: 'focus_session_started' as const,
      properties: {}, occurredAt: 1, expiresAt: 2, deliveryState: 'pending' as const,
      attemptCount: 0, nextAttemptAt: null, createdAt: 1,
    };
    expect(await queueFailure?.analyticsQueue.enqueueBounded(event, 1)).toMatchObject({ ok: false });
    expect(await queueFailure?.analyticsQueue.enqueueBounded(event, 1)).toMatchObject({ ok: true });
  });
});
