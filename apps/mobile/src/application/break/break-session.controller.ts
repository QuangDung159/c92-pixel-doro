import type {
  LoadRunningBreakUseCase,
  RunningBreakProjection,
} from '@pixeldoro/application';

export type BreakSessionProjection =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'ready'; readonly session: RunningBreakProjection }
  | {
      readonly status: 'error';
      readonly code: 'SESSION_UNAVAILABLE' | 'SESSION_READ_FAILED';
    };

export class BreakSessionController {
  private projection: BreakSessionProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private disposed = false;

  constructor(private readonly loader: Pick<LoadRunningBreakUseCase, 'execute'>) {}

  getSnapshot = (): BreakSessionProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh = async (sessionId: string): Promise<void> => {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    const result = await this.loader.execute(sessionId);
    if (this.disposed || generation !== this.generation) return;
    if (result.ok) this.publish({ status: 'ready', session: result.value });
    else this.publish({
      status: 'error',
      code: result.error.code === 'BREAK_SESSION_INELIGIBLE'
        ? 'SESSION_UNAVAILABLE'
        : 'SESSION_READ_FAILED',
    });
  };

  reset = (): void => {
    if (this.disposed) return;
    this.generation += 1;
    this.publish({ status: 'idle' });
  };

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private publish(projection: BreakSessionProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
