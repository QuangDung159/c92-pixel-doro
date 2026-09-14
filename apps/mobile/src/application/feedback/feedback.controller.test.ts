import { describe, expect, it, vi } from 'vitest';

import {
  FEEDBACK_COMMENT_MAX_CODE_POINTS,
  FeedbackController,
} from './feedback.controller';

const setup = () => {
  let sequence = 0;
  const submit = vi.fn().mockResolvedValue('accepted');
  const recordStarted = vi.fn();
  const recordSubmitted = vi.fn();
  const controller = new FeedbackController({
    appVersion: '0.1.0',
    clock: { nowMs: () => 1_000 },
    id: { nextId: () => `id-${++sequence}` },
    platform: () => 'ios',
    provider: { submit },
    recordStarted,
    recordSubmitted,
  });
  controller.activate();
  return { controller, recordStarted, recordSubmitted, submit };
};

describe('FeedbackController', () => {
  it('submits a trimmed memory-only form and records content-free analytics callbacks', async () => {
    const fixture = setup();
    fixture.controller.setScore(4);
    fixture.controller.setComment('  hữu ích  ');
    expect(await fixture.controller.submit()).toBe(true);
    expect(fixture.submit).toHaveBeenCalledWith({
      submissionId: 'id-2', score: 4, comment: 'hữu ích',
      appVersion: '0.1.0', platform: 'ios',
    });
    expect(fixture.recordStarted).toHaveBeenCalledWith('id-1', 1_000);
    expect(fixture.recordSubmitted).toHaveBeenCalledWith('id-2', 1_000);
    expect(fixture.controller.getSnapshot()).toEqual({ status: 'success' });
  });

  it('retries unchanged content with the same submission id and coalesces double submit', async () => {
    const fixture = setup();
    fixture.submit.mockResolvedValueOnce('retryable').mockResolvedValueOnce('accepted');
    fixture.controller.setScore(3);
    const first = fixture.controller.submit();
    expect(fixture.controller.submit()).toBe(first);
    expect(await first).toBe(false);
    expect(fixture.controller.getSnapshot()).toMatchObject({
      status: 'failure', issue: 'NETWORK_REQUIRED',
    });
    expect(await fixture.controller.submit()).toBe(true);
    expect(fixture.submit.mock.calls[0]?.[0].submissionId).toBe(
      fixture.submit.mock.calls[1]?.[0].submissionId,
    );
  });

  it('rejects missing score and bounded Unicode content before provider', async () => {
    const fixture = setup();
    expect(await fixture.controller.submit()).toBe(false);
    expect(fixture.controller.getSnapshot()).toMatchObject({ issue: 'SCORE_REQUIRED' });
    fixture.controller.setScore(5);
    fixture.controller.setComment('🐱'.repeat(FEEDBACK_COMMENT_MAX_CODE_POINTS + 1));
    expect(await fixture.controller.submit()).toBe(false);
    expect(fixture.controller.getSnapshot()).toMatchObject({ issue: 'COMMENT_TOO_LONG' });
    expect(fixture.submit).not.toHaveBeenCalled();
  });

  it('drops draft and ignores late state after deactivation', async () => {
    const fixture = setup();
    let release!: () => void;
    fixture.submit.mockImplementation(() => new Promise<'accepted'>((resolve) => {
      release = () => resolve('accepted');
    }));
    fixture.controller.setScore(5);
    fixture.controller.setComment('private');
    const operation = fixture.controller.submit();
    fixture.controller.deactivate();
    release();
    expect(await operation).toBe(true);
    expect(fixture.controller.getSnapshot()).toEqual({ status: 'idle' });
    fixture.controller.activate();
    expect(fixture.controller.getSnapshot()).toMatchObject({ comment: '', score: null });
  });
});
