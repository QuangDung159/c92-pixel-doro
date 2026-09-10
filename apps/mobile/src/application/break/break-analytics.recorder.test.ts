import { describe, expect, it, vi } from 'vitest';
import type { RunningSessionRecord } from '@pixeldoro/application';

import { BreakAnalyticsRecorder } from './break-analytics.recorder';

const running: RunningSessionRecord = {
  id: 'break-1', profileId: 1, sessionType: 'short_break', focusVariant: null,
  mode: null, status: 'running', workTag: null, configuredDurationMinutes: 5,
  startedAt: 1_000, endsAt: 301_000, backgroundedAt: null, resolvedAt: null,
  xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-09-10', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 1_000,
};

describe('BreakAnalyticsRecorder', () => {
  it('writes deterministic allowlisted fresh Break events', async () => {
    const queue = { enqueueBounded: vi.fn(async () => ({ ok: true as const,
      value: 'enqueued' as const })) };
    const subject = new BreakAnalyticsRecorder({ isCaptureEnabled: () => true, queue });
    await subject.recordStarted(running);
    await subject.recordCompleted({ status: 'completed', sessionId: 'break-1', kind: 'short',
      durationMinutes: 5, startedAt: 1_000, endsAt: 301_000, resolvedAt: 301_000 });
    expect(queue.enqueueBounded).toHaveBeenNthCalledWith(1, expect.objectContaining({
      eventId: 'break_started:break-1', eventName: 'break_started',
      properties: { breakType: 'short_break', durationMinutes: 5 },
    }), 1_000);
    expect(queue.enqueueBounded).toHaveBeenNthCalledWith(2, expect.objectContaining({
      eventId: 'break_completed:break-1', eventName: 'break_completed',
      properties: { breakType: 'short_break', durationMinutes: 5,
        terminalStatus: 'completed' },
    }), 301_000);
  });

  it('honors analytics opt-out and contains queue failures', async () => {
    const disabled = { enqueueBounded: vi.fn() };
    await new BreakAnalyticsRecorder({ isCaptureEnabled: () => false,
      queue: disabled }).recordStarted(running);
    expect(disabled.enqueueBounded).not.toHaveBeenCalled();
    const failed = { enqueueBounded: vi.fn(async () => { throw new Error('queue'); }) };
    await expect(new BreakAnalyticsRecorder({ isCaptureEnabled: () => true,
      queue: failed }).recordStarted(running)).resolves.toBeUndefined();
  });
});
