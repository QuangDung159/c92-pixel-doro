import { describe, expect, it, vi } from 'vitest';

import type {
  ApplicationResult,
  FocusHistoryFirstPageProjection,
  LoadFocusHistoryPageError,
} from '@pixeldoro/application';

import { HistoryController } from './history.controller';

const page: FocusHistoryFirstPageProjection = {
  items: [{
    id: 'history-1',
    status: 'completed',
    workTag: 'coding',
    configuredDurationMinutes: 25,
    endsAt: 2_000_000,
    scheduledEndLocalDate: '2026-09-11',
  }],
  nextCursor: { endsAt: 2_000_000, id: 'history-1' },
};

const success = (value: FocusHistoryFirstPageProjection = page) => ({
  ok: true as const,
  value,
});

const failure = (code: LoadFocusHistoryPageError['code']) => ({
  ok: false as const,
  error: { kind: 'load_focus_history_page_error' as const, code },
});

type LoadResult = ApplicationResult<
  FocusHistoryFirstPageProjection,
  LoadFocusHistoryPageError
>;

const createDependencies = () => {
  const execute = vi.fn<() => Promise<LoadResult>>(async () => success());
  return {
    criticalRecovery: { enterRecovery: vi.fn() },
    loader: { execute },
  };
};

describe('HistoryController', () => {
  it('loads a ready first page and exposes only hasMore to Presentation', async () => {
    const dependencies = createDependencies();
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      items: page.items,
      hasMore: true,
    });
  });

  it('publishes an explicit empty state for a successful empty page', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute.mockResolvedValueOnce(success({ items: [], nextCursor: null }));
    const controller = new HistoryController(dependencies);
    await controller.activate();
    expect(controller.getSnapshot()).toEqual({ status: 'empty' });
  });

  it('coalesces active loading and rapid Retry calls', async () => {
    let finish: ((result: LoadResult) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const controller = new HistoryController(dependencies);

    const activation = controller.activate();
    const duplicate = controller.activate();
    const retries = [controller.retry(), controller.retry()];
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
    finish?.(success());
    await Promise.all([activation, duplicate, ...retries]);
    expect(controller.getSnapshot().status).toBe('ready');
  });

  it('keeps technical errors local and retries explicitly', async () => {
    const dependencies = createDependencies();
    dependencies.loader.execute
      .mockResolvedValueOnce(failure('HISTORY_READ_FAILED'))
      .mockResolvedValueOnce(success());
    const controller = new HistoryController(dependencies);

    await controller.activate();
    expect(controller.getSnapshot()).toEqual({
      status: 'error', code: 'HISTORY_READ_FAILED',
    });
    controller.deactivate();
    await controller.activate();
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
    await controller.retry();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().status).toBe('ready');
    expect(dependencies.criticalRecovery.enterRecovery).not.toHaveBeenCalled();
  });

  it('enters critical recovery once for invalid durable data', async () => {
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

  it('caches ready and empty projections across same-runtime refocus', async () => {
    const readyDependencies = createDependencies();
    const readyController = new HistoryController(readyDependencies);
    await readyController.activate();
    readyController.deactivate();
    await readyController.activate();
    expect(readyDependencies.loader.execute).toHaveBeenCalledOnce();

    const emptyDependencies = createDependencies();
    emptyDependencies.loader.execute.mockResolvedValueOnce(success({ items: [], nextCursor: null }));
    const emptyController = new HistoryController(emptyDependencies);
    await emptyController.activate();
    emptyController.deactivate();
    await emptyController.activate();
    expect(emptyDependencies.loader.execute).toHaveBeenCalledOnce();
  });

  it('does not turn Retry into an implicit refresh outside an error state', async () => {
    const dependencies = createDependencies();
    const controller = new HistoryController(dependencies);
    await controller.activate();
    await controller.retry();
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().status).toBe('ready');
  });

  it('drops stale completion after deactivate and restarts on re-entry', async () => {
    let finish: ((result: ReturnType<typeof success>) => void) | undefined;
    const dependencies = createDependencies();
    dependencies.loader.execute.mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const controller = new HistoryController(dependencies);
    const activation = controller.activate();
    controller.deactivate();
    finish?.(success());
    await activation;
    expect(controller.getSnapshot()).toEqual({ status: 'loading' });

    await controller.activate();
    expect(dependencies.loader.execute).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().status).toBe('ready');
  });

  it('isolates subscriber and loader throws and ignores work after dispose', async () => {
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

    controller.dispose();
    await controller.retry();
    await controller.activate();
    expect(dependencies.loader.execute).toHaveBeenCalledOnce();
  });
});
