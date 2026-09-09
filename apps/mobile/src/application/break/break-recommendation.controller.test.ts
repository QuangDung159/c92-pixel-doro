import type {
  ApplicationResult,
  LoadNextBreakRecommendationError,
  LoadNextBreakRecommendationOutcome,
} from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import { BreakRecommendationController } from './break-recommendation.controller';

type LoaderResult = ApplicationResult<
  LoadNextBreakRecommendationOutcome,
  LoadNextBreakRecommendationError
>;

const ready = (sourceSessionId: string): LoaderResult => ({
  ok: true,
  value: {
    outcome: 'ready',
    sourceSessionId,
    recommendation: {
      kind: 'short',
      sessionType: 'short_break',
      durationMinutes: 5,
    },
    completedStandardFocusCountSinceLastCompletedLongBreak: 1,
    latestCompletedLongBreakSessionId: null,
  },
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('BreakRecommendationController', () => {
  it('publishes exact loading, ready and retry error projections', async () => {
    let attempt = 0;
    const controller = new BreakRecommendationController({
      execute: async (sourceSessionId) => {
        attempt += 1;
        return attempt === 1
          ? {
              ok: false as const,
              error: {
                kind: 'load_next_break_recommendation_error' as const,
                code: 'BREAK_RECOMMENDATION_READ_FAILED' as const,
              },
            }
          : ready(sourceSessionId);
      },
    });

    await controller.refresh('focus-1');
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      sourceSessionId: 'focus-1',
      error: { code: 'BREAK_RECOMMENDATION_READ_FAILED' },
    });
    await controller.refresh('focus-1');
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      sourceSessionId: 'focus-1',
      recommendation: { kind: 'short', durationMinutes: 5 },
    });
  });

  it('coalesces a repeated in-flight refresh for the same source', async () => {
    const pending = deferred<LoaderResult>();
    const execute = vi.fn(() => pending.promise);
    const controller = new BreakRecommendationController({ execute });

    const first = controller.refresh('focus-1');
    const second = controller.refresh('focus-1');
    expect(first).toBe(second);
    expect(execute).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({
      status: 'loading',
      sourceSessionId: 'focus-1',
    });
    pending.resolve(ready('focus-1'));
    await first;
  });

  it('drops a stale response when a new exact source wins', async () => {
    const first = deferred<LoaderResult>();
    const second = deferred<LoaderResult>();
    const execute = vi.fn((sourceSessionId: string) =>
      sourceSessionId === 'focus-1' ? first.promise : second.promise,
    );
    const controller = new BreakRecommendationController({ execute });

    const oldRefresh = controller.refresh('focus-1');
    const currentRefresh = controller.refresh('focus-2');
    second.resolve(ready('focus-2'));
    await currentRefresh;
    first.resolve(ready('focus-1'));
    await oldRefresh;

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      sourceSessionId: 'focus-2',
    });
  });

  it('reset and dispose invalidate pending work', async () => {
    const pending = deferred<LoaderResult>();
    const controller = new BreakRecommendationController({
      execute: () => pending.promise,
    });
    const refresh = controller.refresh('focus-1');
    controller.reset();
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
    pending.resolve(ready('focus-1'));
    await refresh;
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });

    controller.dispose();
    await controller.refresh('focus-2');
    expect(controller.getSnapshot()).toEqual({ status: 'idle' });
  });
});
