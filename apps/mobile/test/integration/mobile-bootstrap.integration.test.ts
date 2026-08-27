import { CreateFoundationSnapshotUseCase } from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import {
  MobileBootstrap,
  type AppLifecyclePort,
  type AppLifecycleState,
  type DatabaseLifecyclePort,
} from '@/application';

class FakeLifecycle implements AppLifecyclePort {
  private listener: ((state: AppLifecycleState) => void) | undefined;
  readonly unsubscribe = vi.fn();

  subscribe(listener: (state: AppLifecycleState) => void): () => void {
    this.listener = listener;
    return this.unsubscribe;
  }

  emit(state: AppLifecycleState): void {
    this.listener?.(state);
  }
}

describe('mobile bootstrap integration', () => {
  it('opens the database before ready and cleans up both lifecycles', async () => {
    const lifecycle = new FakeLifecycle();
    const databaseLifecycle: DatabaseLifecyclePort = {
      open: vi.fn(async () => ({ ok: true as const, value: undefined })),
      close: vi.fn(async () => ({ ok: true as const, value: undefined })),
    };
    const bootstrap = new MobileBootstrap({
      appLifecycle: lifecycle,
      createFoundationSnapshot: new CreateFoundationSnapshotUseCase({
        clock: { nowMs: () => 42 },
        id: { nextId: () => 'mobile-foundation' },
      }),
      databaseLifecycle,
    });

    await bootstrap.boot();
    lifecycle.emit('background');

    expect(bootstrap.getSnapshot()).toMatchObject({
      status: 'ready',
      lifecycleState: 'background',
    });

    await bootstrap.dispose();
    expect(databaseLifecycle.open).toHaveBeenCalledOnce();
    expect(databaseLifecycle.close).toHaveBeenCalledOnce();
    expect(lifecycle.unsubscribe).toHaveBeenCalledOnce();
  });

  it('maps database open failure without exposing a provider exception', async () => {
    const bootstrap = new MobileBootstrap({
      appLifecycle: new FakeLifecycle(),
      createFoundationSnapshot: new CreateFoundationSnapshotUseCase({
        clock: { nowMs: () => 42 },
        id: { nextId: () => 'mobile-foundation' },
      }),
      databaseLifecycle: {
        open: async () => ({
          ok: false,
          error: {
            kind: 'database_lifecycle_error',
            code: 'DATABASE_OPEN_FAILED',
          },
        }),
        close: async () => ({ ok: true, value: undefined }),
      },
    });

    await bootstrap.boot();

    expect(bootstrap.getSnapshot()).toEqual({
      status: 'recovery',
      error: { code: 'DATABASE_OPEN_FAILED' },
    });
  });

  it('does not publish a late ready state when disposed during open', async () => {
    let releaseOpen: () => void = () => undefined;
    const openGate = new Promise<void>((resolve) => {
      releaseOpen = resolve;
    });
    const databaseLifecycle: DatabaseLifecyclePort = {
      open: vi.fn(async () => {
        await openGate;
        return { ok: true as const, value: undefined };
      }),
      close: vi.fn(async () => ({ ok: true as const, value: undefined })),
    };
    const bootstrap = new MobileBootstrap({
      appLifecycle: new FakeLifecycle(),
      createFoundationSnapshot: new CreateFoundationSnapshotUseCase({
        clock: { nowMs: () => 42 },
        id: { nextId: () => 'mobile-foundation' },
      }),
      databaseLifecycle,
    });

    const boot = bootstrap.boot();
    const dispose = bootstrap.dispose();
    releaseOpen();
    await boot;
    await dispose;

    expect(bootstrap.getSnapshot()).toEqual({ status: 'idle' });
    expect(databaseLifecycle.close).toHaveBeenCalledOnce();
  });

  it('maps a thrown database exception to the stable recovery code', async () => {
    const bootstrap = new MobileBootstrap({
      appLifecycle: new FakeLifecycle(),
      createFoundationSnapshot: new CreateFoundationSnapshotUseCase({
        clock: { nowMs: () => 42 },
        id: { nextId: () => 'mobile-foundation' },
      }),
      databaseLifecycle: {
        open: async () => {
          throw new Error('raw native provider detail');
        },
        close: async () => ({ ok: true, value: undefined }),
      },
    });

    await expect(bootstrap.boot()).resolves.toBeUndefined();
    expect(bootstrap.getSnapshot()).toEqual({
      status: 'recovery',
      error: { code: 'DATABASE_OPEN_FAILED' },
    });
  });
});
