import { describe, expect, it, vi } from 'vitest';

import {
  buildFocusHistorySections,
  type ApplicationResult,
  type FocusHistoryItemProjection,
  type FocusHistoryPageProjection,
  type LoadFocusHistoryPageError,
  type LoadFocusHistoryPageInput,
} from '@pixeldoro/application';

import { HistoryController } from './history.controller';

const item = (
  id: string,
  endsAt: number,
  overrides: Partial<FocusHistoryItemProjection> = {},
): FocusHistoryItemProjection => ({
  id,
  status: 'completed',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  endsAt,
  scheduledEndLocalDate: '2026-09-11',
  ...overrides,
});

const first = item('history-1', 4_000_000);
const cursor = { endsAt: first.endsAt, id: first.id };
const page: FocusHistoryPageProjection = { items: [first], nextCursor: cursor };
const success = (value: FocusHistoryPageProjection = page) => ({
  ok: true as const,
  value,
});
const failure = (code: LoadFocusHistoryPageError['code']) => ({
  ok: false as const,
  error: { kind: 'load_focus_history_page_error' as const, code },
});
type LoadResult = ApplicationResult<FocusHistoryPageProjection, LoadFocusHistoryPageError>;

const createDependencies = () => {
  const execute = vi.fn<(input: LoadFocusHistoryPageInput) => Promise<LoadResult>>(
    async () => success(),
  );
  return {
    buildSections: buildFocusHistorySections,
    criticalRecovery: { enterRecovery: vi.fn() },
    loader: { execute },
  };
};

describe('HistoryController', () => {
  it('loads grouped committed history and keeps cursor private', async () => {
    const dependencies = createDependencies();
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(dependencies.loader.execute).toHaveBeenCalledWith({ cursor: null });
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      sections: [{ localDate: '2026-09-11', completedMinutes: 25, items: [first] }],
      refresh: 'idle',
      pagination: 'idle',
    });
  });

  it('publishes committed empty and refreshes it without a blocking fallback', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce(success({ items: [], nextCursor: null }))
      .mockResolvedValueOnce(failure('HISTORY_READ_FAILED'));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'empty', refresh: 'idle' });
    controller.deactivate();
    const refresh = controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'empty', refresh: 'refreshing' });
    await refresh;
    expect(controller.getSnapshot()).toEqual({ status: 'empty', refresh: 'error' });
  });

  it('keeps an initial technical error local and retries only that intent', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce(failure('HISTORY_READ_FAILED'))
      .mockResolvedValueOnce(success());
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'error', code: 'HISTORY_READ_FAILED',
    });
    await controller.retryInitial();
    expect(controller.getSnapshot().status).toBe('ready');
    expect(dependencies.criticalRecovery.enterRecovery).not.toHaveBeenCalled();
  });

  it('appends from the exact cursor and merges a split date section once', async () => {
    const dependencies = createDependencies();
    const older = item('history-2', 2_000_000, { status: 'failed' });
    dependencies.loader.execute
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(success({ items: [older], nextCursor: null }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    await controller.loadMore();
    expect(dependencies.loader.execute).toHaveBeenNthCalledWith(2, { cursor });
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      sections: [{
        localDate: '2026-09-11',
        completedMinutes: 25,
        items: [first, older],
      }],
      refresh: 'idle',
      pagination: 'end',
    });
    await controller.loadMore();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
  });

  it('retains rows and cursor after append failure then retries the same intent', async () => {
    const dependencies = createDependencies();
    const older = item('history-2', 2_000_000);
    dependencies.loader.execute
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(failure('HISTORY_READ_FAILED'))
      .mockResolvedValueOnce(success({ items: [older], nextCursor: null }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    await controller.loadMore();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', pagination: 'error',
    });
    await controller.retryLoadMore();
    expect(dependencies.loader.execute).toHaveBeenNthCalledWith(2, { cursor });
    expect(dependencies.loader.execute).toHaveBeenNthCalledWith(3, { cursor });
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', pagination: 'end',
    });
  });

  it('retains committed rows on refresh failure and replaces them on retry success', async () => {
    const dependencies = createDependencies();
    const replacement = item('new-history', 6_000_000, {
      scheduledEndLocalDate: '2026-09-12',
    });
    dependencies.loader.execute
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(failure('HISTORY_READ_FAILED'))
      .mockResolvedValueOnce(success({ items: [replacement], nextCursor: null }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    controller.deactivate();
    await controller.activate();
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', refresh: 'error', sections: [{ items: [first] }],
    });
    await controller.retryRefresh();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      sections: [{
        localDate: '2026-09-12', completedMinutes: 25, items: [replacement],
      }],
      refresh: 'idle',
      pagination: 'end',
    });
  });

  it('gives refresh priority and ignores a late append response', async () => {
    let finishAppend: ((result: LoadResult) => void) | undefined;
    let finishRefresh: ((result: LoadResult) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce(success())
      .mockImplementationOnce(() => new Promise((resolve) => { finishAppend = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { finishRefresh = resolve; }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    const append = controller.loadMore();
    const refresh = controller.refresh();
    const replacement = item('new-history', 8_000_000, {
      scheduledEndLocalDate: '2026-09-12',
    });
    finishRefresh?.(success({ items: [replacement], nextCursor: null }));
    await refresh;
    finishAppend?.(success({ items: [item('old', 2_000_000)], nextCursor: null }));
    await append;
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', sections: [{ items: [replacement] }], pagination: 'end',
    });
  });

  it('fails closed for conflicting duplicates during append', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(success({
        items: [item(first.id, 2_000_000, { status: 'failed' })],
        nextCursor: null,
      }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    await controller.loadMore();
    expect(dependencies.criticalRecovery.enterRecovery)
      .toHaveBeenCalledExactlyOnceWith('DURABLE_DATA_CORRUPT');
    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready', sections: [{ items: [first] }],
    });
  });

  it('enters Recovery for invalid first-page data', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute.mockResolvedValueOnce(failure('HISTORY_DATA_INVALID'));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'error', code: 'HISTORY_DATA_INVALID',
    });
    expect(dependencies.criticalRecovery.enterRecovery)
      .toHaveBeenCalledExactlyOnceWith('DURABLE_DATA_CORRUPT');
  });

  it('drops deactivated work, restarts on refocus and ignores work after dispose', async () => {
    let finish: ((result: LoadResult) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const controller = new HistoryController(dependencies);
    const initial = controller.activate();
    controller.deactivate();
    finish?.(success());
    await initial;
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    await controller.activate();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
    controller.dispose();
    await controller.refresh();
    await controller.loadMore();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
  });

  it('isolates subscriber and loader throws', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute.mockRejectedValueOnce(new Error('read failed'));
    const controller = new HistoryController(dependencies);
    const listener = vi.fn(() => { throw new Error('subscriber failed'); });
    controller.subscribe(listener);
    await expect(controller.activate()).resolves.toBeUndefined();
    expect(controller.getSnapshot()).toEqual({
      status: 'error', code: 'HISTORY_READ_FAILED',
    });
    expect(listener).toHaveBeenCalled();
  });
});
