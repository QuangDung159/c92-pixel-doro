import { describe, expect, it, vi } from 'vitest';
import type {
  ApplicationResult,
  ContributionRangeProjection,
  LoadDailyContributionError,
} from '@pixeldoro/application';

import { ContributionController } from './contribution.controller';

const projection = (endLocalDate = '2026-09-12'): ContributionRangeProjection => ({
  startLocalDate: '2026-09-06',
  endLocalDate,
  days: [{
    localDate: endLocalDate,
    completedMinutes: 25,
    completedSessionCount: 1,
    intensity: 'medium',
  }],
});

const success = (value = projection()) => ({ ok: true as const, value });
const failure = (code: LoadDailyContributionError['code']) => ({
  ok: false as const,
  error: { kind: 'load_daily_contribution_error' as const, code },
});
type LoadResult = ApplicationResult<ContributionRangeProjection, LoadDailyContributionError>;

const dependencies = () => ({
  criticalRecovery: { enterRecovery: vi.fn() },
  loader: {
    execute: vi.fn<() => Promise<LoadResult>>(async () => success()),
  },
});

describe('ContributionController', () => {
  it('loads a ready projection and coalesces duplicate activation', async () => {
    let finish: ((result: LoadResult) => void) | undefined;
    const deps = dependencies();
    deps.loader.execute.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const controller = new ContributionController(deps);
    const first = controller.activate();
    const duplicate = controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    expect(deps.loader.execute).toHaveBeenCalledTimes(1);
    finish?.(success());
    await Promise.all([first, duplicate]);
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', value: projection(), refresh: 'idle',
    });
  });

  it.each(['CONTRIBUTION_DATE_UNAVAILABLE', 'CONTRIBUTION_READ_FAILED'] as const)(
    'keeps initial %s local and retries',
    async (code) => {
      const deps = dependencies();
      deps.loader.execute.mockResolvedValueOnce(failure(code)).mockResolvedValueOnce(success());
      const controller = new ContributionController(deps);
      await controller.activate();
      expect(controller.getSnapshot()).toEqual({ status: 'error', code });
      await controller.retryInitial();
      expect(controller.getSnapshot().status).toBe('ready');
      expect(deps.criticalRecovery.enterRecovery).not.toHaveBeenCalled();
    },
  );

  it('retains committed contribution after refresh failure then replaces it on retry', async () => {
    const deps = dependencies();
    const replacement = projection('2026-09-13');
    deps.loader.execute
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(failure('CONTRIBUTION_READ_FAILED'))
      .mockResolvedValueOnce(success(replacement));
    const controller = new ContributionController(deps);
    await controller.activate();
    controller.deactivate();
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', value: projection(), refresh: 'error',
    });
    await controller.retryRefresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready', value: replacement, refresh: 'idle',
    });
  });

  it('enters Recovery only for invalid durable contribution data', async () => {
    const deps = dependencies();
    deps.loader.execute.mockResolvedValueOnce(failure('CONTRIBUTION_DATA_INVALID'));
    const controller = new ContributionController(deps);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'error', code: 'CONTRIBUTION_DATA_INVALID',
    });
    expect(deps.criticalRecovery.enterRecovery)
      .toHaveBeenCalledExactlyOnceWith('DURABLE_DATA_CORRUPT');
  });

  it('drops stale deactivated completion and restarts on refocus', async () => {
    let finish: ((result: LoadResult) => void) | undefined;
    const deps = dependencies();
    deps.loader.execute.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const controller = new ContributionController(deps);
    const initial = controller.activate();
    controller.deactivate();
    finish?.(success());
    await initial;
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    await controller.activate();
    expect(deps.loader.execute).toHaveBeenCalledTimes(2);
  });

  it('drops late Recovery and subscriber failures after deactivate/dispose', async () => {
    let finish: ((result: LoadResult) => void) | undefined;
    const deps = dependencies();
    deps.loader.execute.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const controller = new ContributionController(deps);
    controller.subscribe(() => { throw new Error('subscriber'); });
    const initial = controller.activate();
    controller.deactivate();
    controller.dispose();
    finish?.(failure('CONTRIBUTION_DATA_INVALID'));
    await initial;
    expect(deps.criticalRecovery.enterRecovery).not.toHaveBeenCalled();
    await controller.activate();
    expect(deps.loader.execute).toHaveBeenCalledTimes(1);
  });
});
