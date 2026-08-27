import { CreateFoundationSnapshotUseCase } from '@pixeldoro/application';
import { describe, expect, it, vi } from 'vitest';

import {
  MobileBootstrap,
  type AppLifecyclePort,
  type AppLifecycleState,
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
  it('owns one lifecycle subscription and cleans it up', () => {
    const lifecycle = new FakeLifecycle();
    const bootstrap = new MobileBootstrap({
      appLifecycle: lifecycle,
      createFoundationSnapshot: new CreateFoundationSnapshotUseCase({
        clock: { nowMs: () => 42 },
        id: { nextId: () => 'mobile-foundation' },
      }),
    });

    bootstrap.boot();
    lifecycle.emit('background');

    expect(bootstrap.getSnapshot()).toMatchObject({
      status: 'ready',
      lifecycleState: 'background',
    });

    bootstrap.dispose();
    expect(lifecycle.unsubscribe).toHaveBeenCalledOnce();
  });
});

